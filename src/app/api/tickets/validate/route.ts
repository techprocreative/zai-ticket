import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { qrCode, gateEntryId } = body

    if (!qrCode || !gateEntryId) {
      return NextResponse.json(
        { error: 'QR code and gate entry ID are required' },
        { status: 400 }
      )
    }

    // Find the ticket by QR code
    const ticket = await db.ticket.findUnique({
      where: {
        qrCode: qrCode.trim()
      },
      include: {
        event: true,
        ticketType: true,
        user: {
          select: {
            id: true,
            name: true,
            email: true
          }
        },
        gateScans: {
          include: {
            gateEntry: true
          },
          orderBy: {
            scanTime: 'desc'
          }
        }
      }
    })

    if (!ticket) {
      return NextResponse.json(
        { error: 'Tiket tidak ditemukan' },
        { status: 404 }
      )
    }

    // Check if ticket is still valid
    if (ticket.status !== 'ACTIVE') {
      const statusMessages = {
        'USED': 'Tiket sudah digunakan',
        'CANCELLED': 'Tiket dibatalkan',
        'EXPIRED': 'Tiket kadaluarsa'
      }
      
      return NextResponse.json(
        { 
          error: statusMessages[ticket.status as keyof typeof statusMessages] || 'Tiket tidak valid',
          ticket
        },
        { status: 400 }
      )
    }

    // Check if event is still valid
    const now = new Date()
    if (now < ticket.event.startDate) {
      return NextResponse.json(
        { error: 'Event belum dimulai', ticket },
        { status: 400 }
      )
    }

    if (now > ticket.event.endDate) {
      return NextResponse.json(
        { error: 'Event sudah berakhir', ticket },
        { status: 400 }
      )
    }

    // Check if gate entry is valid
    const gateEntry = await db.gateEntry.findUnique({
      where: {
        id: gateEntryId,
        isActive: true
      }
    })

    if (!gateEntry) {
      return NextResponse.json(
        { error: 'Gate entry tidak valid atau tidak aktif' },
        { status: 400 }
      )
    }

    // Check if ticket belongs to the same event as the gate
    if (ticket.eventId !== gateEntry.eventId) {
      return NextResponse.json(
        { error: 'Tiket tidak valid untuk event ini' },
        { status: 400 }
      )
    }

    // Check if ticket was already scanned at this gate
    const existingScan = await db.gateScan.findFirst({
      where: {
        ticketId: ticket.id,
        gateEntryId: gateEntryId
      }
    })

    if (existingScan) {
      return NextResponse.json(
        { 
          error: 'Tiket sudah discan di gate ini',
          ticket
        },
        { status: 400 }
      )
    }

    // Record the gate scan
    const gateScan = await db.gateScan.create({
      data: {
        ticketId: ticket.id,
        gateEntryId: gateEntryId,
        isValid: true
      },
      include: {
        gateEntry: true
      }
    })

    // Update ticket status to USED
    const updatedTicket = await db.ticket.update({
      where: {
        id: ticket.id
      },
      data: {
        status: 'USED',
        scannedAt: new Date()
      },
      include: {
        event: true,
        ticketType: true,
        user: {
          select: {
            id: true,
            name: true,
            email: true
          }
        },
        gateScans: {
          include: {
            gateEntry: true
          },
          orderBy: {
            scanTime: 'desc'
          }
        }
      }
    })

    return NextResponse.json({
      message: 'Tiket berhasil divalidasi',
      ticket: updatedTicket,
      gateScan
    })

  } catch (error) {
    console.error('Failed to validate ticket:', error)
    return NextResponse.json(
      { error: 'Gagal memvalidasi tiket' },
      { status: 500 }
    )
  }
}
import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const ticketTypeId = searchParams.get('ticketTypeId')
    const eventId = searchParams.get('eventId')

    if (!ticketTypeId) {
      return NextResponse.json(
        { error: 'Ticket type ID is required' },
        { status: 400 }
      )
    }

    const ticketType = await db.ticketType.findUnique({
      where: { id: ticketTypeId },
      include: {
        event: {
          select: {
            id: true,
            title: true
          }
        }
      }
    })

    if (!ticketType) {
      return NextResponse.json(
        { error: 'Ticket type not found' },
        { status: 404 }
      )
    }

    const available = ticketType.maxQuantity - ticketType.soldQuantity

    return NextResponse.json({
      ticketTypeId,
      available,
      total: ticketType.maxQuantity,
      sold: ticketType.soldQuantity,
      eventId: ticketType.eventId,
      eventTitle: ticketType.event.title
    })
  } catch (error) {
    console.error('Failed to check availability:', error)
    return NextResponse.json(
      { error: 'Failed to check availability' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { ticketTypeId, quantity } = body

    if (!ticketTypeId || !quantity) {
      return NextResponse.json(
        { error: 'Ticket type ID and quantity are required' },
        { status: 400 }
      )
    }

    // Start transaction
    const result = await db.$transaction(async (tx) => {
      const ticketType = await tx.ticketType.findUnique({
        where: { id: ticketTypeId }
      })

      if (!ticketType) {
        throw new Error('Ticket type not found')
      }

      const available = ticketType.maxQuantity - ticketType.soldQuantity
      if (quantity > available) {
        throw new Error('Insufficient tickets available')
      }

      // Reserve tickets (update sold quantity)
      const updatedTicketType = await tx.ticketType.update({
        where: { id: ticketTypeId },
        data: {
          soldQuantity: {
            increment: quantity
          }
        }
      })

      return {
        success: true,
        available: ticketType.maxQuantity - updatedTicketType.soldQuantity,
        ticketType: updatedTicketType
      }
    })

    return NextResponse.json(result)
  } catch (error) {
    console.error('Failed to reserve tickets:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to reserve tickets' },
      { status: 500 }
    )
  }
}
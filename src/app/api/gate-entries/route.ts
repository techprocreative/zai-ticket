import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(request: NextRequest) {
  try {
    const gateEntries = await db.gateEntry.findMany({
      where: {
        isActive: true
      },
      include: {
        _count: {
          select: {
            gateScans: true
          }
        }
      },
      orderBy: {
        name: 'asc'
      }
    })

    return NextResponse.json(gateEntries)
  } catch (error) {
    console.error('Failed to fetch gate entries:', error)
    return NextResponse.json(
      { error: 'Failed to fetch gate entries' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { eventId, name, location } = body

    if (!eventId || !name) {
      return NextResponse.json(
        { error: 'Event ID and name are required' },
        { status: 400 }
      )
    }

    const gateEntry = await db.gateEntry.create({
      data: {
        eventId,
        name,
        location: location || null
      }
    })

    return NextResponse.json(gateEntry, { status: 201 })
  } catch (error) {
    console.error('Failed to create gate entry:', error)
    return NextResponse.json(
      { error: 'Failed to create gate entry' },
      { status: 500 }
    )
  }
}
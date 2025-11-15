import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { EventStatus } from '@prisma/client'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')
    const limit = parseInt(searchParams.get('limit') || '50')
    const offset = parseInt(searchParams.get('offset') || '0')

    const where = status ? { status: status.toUpperCase() as EventStatus } : {}

    const events = await db.event.findMany({
      where,
      include: {
        ticketTypes: {
          select: {
            id: true,
            name: true,
            price: true,
            soldQuantity: true,
            maxQuantity: true,
            isValid: true
          }
        },
        _count: {
          select: {
            tickets: true,
            orders: true
          }
        }
      },
      orderBy: {
        startDate: 'asc'
      },
      take: limit,
      skip: offset
    })

    return NextResponse.json(events)
  } catch (error) {
    console.error('Failed to fetch events:', error)
    return NextResponse.json(
      { error: 'Failed to fetch events' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      title,
      description,
      venue,
      address,
      startDate,
      endDate,
      maxCapacity,
      ticketTypes,
      imageUrl
    } = body

    const event = await db.event.create({
      data: {
        title,
        description,
        venue,
        address,
        startDate: new Date(startDate),
        endDate: new Date(endDate),
        maxCapacity,
        ticketTypes: {
          create: ticketTypes.map((type: any) => ({
            name: type.name,
            description: type.description,
            price: type.price,
            maxQuantity: type.maxQuantity
          }))
        },
        imageUrl
      },
      include: {
        ticketTypes: true
      }
    })

    return NextResponse.json(event, { status: 201 })
  } catch (error) {
    console.error('Failed to create event:', error)
    return NextResponse.json(
      { error: 'Failed to create event' },
      { status: 500 }
    )
  }
}
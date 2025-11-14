import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { randomBytes } from 'crypto'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { userId, eventId, items, totalAmount, paymentMethod } = body

    if (!userId || !eventId || !items || items.length === 0) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Start transaction
    const result = await db.$transaction(async (tx) => {
      // Create order
      const order = await tx.order.create({
        data: {
          userId,
          eventId,
          totalAmount,
          status: 'PENDING',
          paymentMethod,
          items: {
            create: items.map((item: any) => ({
              ticketTypeId: item.ticketTypeId,
              quantity: item.quantity,
              unitPrice: item.unitPrice,
              totalPrice: item.totalPrice
            }))
          }
        },
        include: {
          items: true,
          event: true
        }
      })

      // Create tickets for each order item
      const tickets = []
      for (const item of items) {
        for (let i = 0; i < item.quantity; i++) {
          const qrCode = generateQRCode(order.id, item.ticketTypeId, i)
          const ticket = await tx.ticket.create({
            data: {
              userId,
              orderId: order.id,
              ticketTypeId: item.ticketTypeId,
              eventId,
              qrCode,
              status: 'ACTIVE'
            }
          })
          tickets.push(ticket)
        }

        // Update ticket type sold quantity
        await tx.ticketType.update({
          where: { id: item.ticketTypeId },
          data: {
            soldQuantity: {
              increment: item.quantity
            }
          }
        })
      }

      // Update event current capacity
      const totalTickets = items.reduce((sum: number, item: any) => sum + item.quantity, 0)
      await tx.event.update({
        where: { id: eventId },
        data: {
          currentCapacity: {
            increment: totalTickets
          }
        }
      })

      return { order, tickets }
    })

    return NextResponse.json(result.order, { status: 201 })
  } catch (error) {
    console.error('Failed to create order:', error)
    return NextResponse.json(
      { error: 'Failed to create order' },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')
    const eventId = searchParams.get('eventId')
    const status = searchParams.get('status')
    const limit = parseInt(searchParams.get('limit') || '50')
    const offset = parseInt(searchParams.get('offset') || '0')

    const where: any = {}
    if (userId) where.userId = userId
    if (eventId) where.eventId = eventId
    if (status) where.status = status.toUpperCase()

    const orders = await db.order.findMany({
      where,
      include: {
        user: {
          select: {
            id: true,
            email: true,
            name: true
          }
        },
        event: {
          select: {
            id: true,
            title: true,
            venue: true,
            startDate: true,
            endDate: true
          }
        },
        items: {
          include: {
            ticketType: true
          }
        },
        tickets: {
          include: {
            ticketType: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      },
      take: limit,
      skip: offset
    })

    return NextResponse.json(orders)
  } catch (error) {
    console.error('Failed to fetch orders:', error)
    return NextResponse.json(
      { error: 'Failed to fetch orders' },
      { status: 500 }
    )
  }
}

function generateQRCode(orderId: string, ticketTypeId: string, index: number): string {
  const timestamp = Date.now()
  const random = randomBytes(8).toString('hex')
  return `TKT-${orderId}-${ticketTypeId}-${index}-${timestamp}-${random}`
}
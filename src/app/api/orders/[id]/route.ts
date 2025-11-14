import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const order = await db.order.findUnique({
      where: {
        id: params.id
      },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            name: true,
            phone: true
          }
        },
        event: {
          select: {
            id: true,
            title: true,
            venue: true,
            address: true,
            startDate: true,
            endDate: true,
            imageUrl: true
          }
        },
        items: {
          include: {
            ticketType: {
              select: {
                id: true,
                name: true,
                price: true,
                description: true
              }
            }
          }
        },
        tickets: {
          include: {
            ticketType: {
              select: {
                id: true,
                name: true,
                price: true
              }
            }
          }
        }
      }
    })

    if (!order) {
      return NextResponse.json(
        { error: 'Order not found' },
        { status: 404 }
      )
    }

    return NextResponse.json(order)
  } catch (error) {
    console.error('Failed to fetch order:', error)
    return NextResponse.json(
      { error: 'Failed to fetch order' },
      { status: 500 }
    )
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json()
    const { status, paymentId } = body

    const order = await db.order.update({
      where: {
        id: params.id
      },
      data: {
        status,
        ...(paymentId && { paymentId })
      },
      include: {
        user: true,
        event: true,
        tickets: true
      }
    })

    return NextResponse.json(order)
  } catch (error) {
    console.error('Failed to update order:', error)
    return NextResponse.json(
      { error: 'Failed to update order' },
      { status: 500 }
    )
  }
}
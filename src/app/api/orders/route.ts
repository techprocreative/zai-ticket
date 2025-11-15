import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { midtransClient, generateSnapParams } from '@/lib/midtrans'
import { env } from '@/lib/env'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { userId, eventId, items, totalAmount } = body

    if (!userId || !eventId || !items || items.length === 0) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Validate items and check availability
    for (const item of items) {
      const ticketType = await db.ticketType.findUnique({
        where: { id: item.ticketTypeId }
      })

      if (!ticketType) {
        return NextResponse.json(
          { error: `Ticket type ${item.ticketTypeId} not found` },
          { status: 404 }
        )
      }

      const available = ticketType.maxQuantity - ticketType.soldQuantity
      if (available < item.quantity) {
        return NextResponse.json(
          { error: `Only ${available} tickets available for ${ticketType.name}` },
          { status: 400 }
        )
      }
    }

    // Start transaction
    const result = await db.$transaction(async (tx) => {
      // Set expiry time (30 minutes from now)
      const expiresAt = new Date(Date.now() + 30 * 60 * 1000)

      // Create order (WITHOUT tickets - tickets created after payment)
      const order = await tx.order.create({
        data: {
          userId,
          eventId,
          totalAmount,
          status: 'PENDING',
          expiresAt, // Set expiry
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
          items: {
            include: {
              ticketType: true
            }
          },
          event: true,
          user: true
        }
      })

      // Reserve tickets (increment soldQuantity)
      for (const item of items) {
        await tx.ticketType.update({
          where: { id: item.ticketTypeId },
          data: {
            soldQuantity: {
              increment: item.quantity
            }
          }
        })
      }

      return order
    })

    // Generate Midtrans Snap token
    try {
      const snapItems = result.items.map(item => ({
        id: item.ticketTypeId,
        price: item.unitPrice,
        quantity: item.quantity,
        name: item.ticketType.name
      }))

      const customer = {
        first_name: result.user.name?.split(' ')[0] || 'User',
        last_name: result.user.name?.split(' ').slice(1).join(' ') || '',
        email: result.user.email,
        phone: result.user.phone || '08123456789'
      }

      const callbackUrl = `${env.NEXTAUTH_URL}/success/${result.id}`

      const snapParams = generateSnapParams(
        result.id,
        snapItems,
        customer,
        callbackUrl
      )

      const snapResponse = await midtransClient.createTransaction(snapParams)

      // Update order with Snap token
      await db.order.update({
        where: { id: result.id },
        data: {
          midtransSnapToken: snapResponse.token,
          paymentUrl: snapResponse.redirect_url,
          updatedAt: new Date()
        }
      })

      console.log('Order created with Snap token:', result.id)

      return NextResponse.json({
        orderId: result.id,
        snapToken: snapResponse.token,
        paymentUrl: snapResponse.redirect_url,
        expiresAt: result.expiresAt,
        totalAmount: result.totalAmount
      }, { status: 201 })

    } catch (snapError) {
      console.error('Failed to create Snap token:', snapError)
      
      // If Snap creation fails, cancel the order
      await db.$transaction(async (tx) => {
        await tx.order.update({
          where: { id: result.id },
          data: { status: 'CANCELLED' }
        })

        // Restore ticket availability
        for (const item of result.items) {
          await tx.ticketType.update({
            where: { id: item.ticketTypeId },
            data: {
              soldQuantity: { decrement: item.quantity }
            }
          })
        }
      })

      return NextResponse.json(
        { error: 'Failed to create payment token. Please try again.' },
        { status: 500 }
      )
    }

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

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db'
import { midtransClient, generateSnapParams } from '@/lib/midtrans'

/**
 * Create Midtrans Snap Token
 * 
 * This endpoint creates a Snap token for an existing order
 * The token is used by Snap.js to display the payment popup
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { orderId } = await request.json()

    if (!orderId) {
      return NextResponse.json(
        { error: 'Order ID is required' },
        { status: 400 }
      )
    }

    // Get order with details
    const order = await db.order.findUnique({
      where: { id: orderId },
      include: {
        user: true,
        event: true,
        items: {
          include: {
            ticketType: true
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

    // Verify order belongs to user (or user is admin)
    if (order.userId !== session.user.id && session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 403 }
      )
    }

    // Check if order is already paid or cancelled
    if (order.status !== 'PENDING') {
      return NextResponse.json(
        { error: `Order is already ${order.status.toLowerCase()}` },
        { status: 400 }
      )
    }

    // Check if order has expired
    if (order.expiresAt && order.expiresAt < new Date()) {
      return NextResponse.json(
        { error: 'Order has expired' },
        { status: 400 }
      )
    }

    // Return existing token if available and still valid
    if (order.midtransSnapToken) {
      return NextResponse.json({
        token: order.midtransSnapToken,
        orderId: order.id
      })
    }

    // Prepare Snap parameters
    const items = order.items.map(item => ({
      id: item.ticketTypeId,
      price: item.unitPrice,
      quantity: item.quantity,
      name: item.ticketType.name
    }))

    const customer = {
      first_name: order.user.name?.split(' ')[0] || 'User',
      last_name: order.user.name?.split(' ').slice(1).join(' ') || '',
      email: order.user.email,
      phone: order.user.phone || '08123456789'
    }

    const callbackUrl = `${process.env.NEXTAUTH_URL}/success/${order.id}`

    const snapParams = generateSnapParams(
      order.id,
      items,
      customer,
      callbackUrl
    )

    // Create Snap transaction
    const snapResponse = await midtransClient.createTransaction(snapParams)

    // Update order with Snap token
    await db.order.update({
      where: { id: order.id },
      data: {
        midtransSnapToken: snapResponse.token,
        paymentUrl: snapResponse.redirect_url,
        updatedAt: new Date()
      }
    })

    console.log('Snap token created for order:', order.id)

    return NextResponse.json({
      token: snapResponse.token,
      orderId: order.id,
      redirectUrl: snapResponse.redirect_url
    })

  } catch (error) {
    console.error('Create Snap token error:', error)
    return NextResponse.json(
      { 
        error: 'Failed to create payment token',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}
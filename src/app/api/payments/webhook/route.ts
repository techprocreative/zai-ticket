import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { midtransClient, type MidtransNotification } from '@/lib/midtrans'
import { sendEmail } from '@/lib/email'
import { withRateLimit } from '@/lib/rate-limit'

/**
 * Midtrans Payment Notification Webhook
 *
 * This endpoint receives payment notifications from Midtrans
 * Documentation: https://docs.midtrans.com/en/after-payment/http-notification
 *
 * Security: Always verify signature to prevent fraud
 * Rate Limited: 100 requests per minute per IP to prevent abuse
 */
async function handler(request: NextRequest) {
  try {
    const notification: MidtransNotification = await request.json()

    console.log('Received Midtrans notification:', {
      order_id: notification.order_id,
      transaction_status: notification.transaction_status,
      fraud_status: notification.fraud_status
    })

    // 1. Verify signature
    if (!midtransClient.verifySignature(notification)) {
      console.error('Invalid signature for order:', notification.order_id)
      return NextResponse.json(
        { error: 'Invalid signature' },
        { status: 401 }
      )
    }

    // 2. Get order from database
    const order = await db.order.findUnique({
      where: { id: notification.order_id },
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
      console.error('Order not found:', notification.order_id)
      return NextResponse.json(
        { error: 'Order not found' },
        { status: 404 }
      )
    }

    // 3. Check if already processed (idempotency)
    if (order.status !== 'PENDING') {
      console.log('Order already processed:', order.id, 'Status:', order.status)
      return NextResponse.json({
        message: 'Order already processed',
        status: order.status
      })
    }

    // 4. Map transaction status
    const newStatus = midtransClient.mapTransactionStatus(
      notification.transaction_status,
      notification.fraud_status
    )

    // 5. Update order based on status
    if (newStatus === 'PAID') {
      await handleSuccessfulPayment(order, notification)
    } else if (newStatus === 'CANCELLED') {
      await handleFailedPayment(order, notification)
    } else {
      // Status still pending, update transaction info
      await db.order.update({
        where: { id: order.id },
        data: {
          midtransTransactionId: notification.transaction_id,
          paymentMethod: notification.payment_type,
          updatedAt: new Date()
        }
      })
    }

    return NextResponse.json({
      message: 'Notification processed successfully',
      order_id: order.id,
      status: newStatus
    })

  } catch (error) {
    console.error('Webhook error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * Handle successful payment
 */
async function handleSuccessfulPayment(
  order: any,
  notification: MidtransNotification
) {
  try {
    // Start transaction
    await db.$transaction(async (tx) => {
      // 1. Update order status
      await tx.order.update({
        where: { id: order.id },
        data: {
          status: 'PAID',
          paidAt: new Date(),
          midtransTransactionId: notification.transaction_id,
          paymentMethod: notification.payment_type,
          updatedAt: new Date()
        }
      })

      // 2. Generate tickets (if not already generated)
      const existingTickets = await tx.ticket.count({
        where: { orderId: order.id }
      })

      if (existingTickets === 0) {
        // Generate tickets for each order item
        for (const item of order.items) {
          const tickets: any[] = []
          
          for (let i = 0; i < item.quantity; i++) {
            const qrCode = `TKT-${order.id}-${item.ticketTypeId}-${i + 1}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
            
            tickets.push({
              userId: order.userId,
              orderId: order.id,
              ticketTypeId: item.ticketTypeId,
              eventId: order.eventId,
              qrCode,
              status: 'ACTIVE'
            })
          }

          await tx.ticket.createMany({ data: tickets })
        }

        console.log(`Generated ${order.items.reduce((sum: number, item: any) => sum + item.quantity, 0)} tickets for order ${order.id}`)
      }
    })

    // 3. Send confirmation email (outside transaction)
    try {
      const ticketCount = order.items.reduce((sum: number, item: any) => sum + item.quantity, 0)
      
      await sendEmail({
        to: order.user.email,
        subject: `Pembayaran Berhasil - Order #${order.id}`,
        template: 'order-confirmation',
        data: {
          name: order.user.name || 'User',
          orderId: order.id,
          eventTitle: order.event.title,
          ticketCount: ticketCount.toString(),
          totalAmount: order.totalAmount
        }
      })

      console.log('Confirmation email sent to:', order.user.email)
    } catch (emailError) {
      console.error('Failed to send confirmation email:', emailError)
      // Don't fail the webhook if email fails
    }

    console.log('Payment processed successfully for order:', order.id)
  } catch (error) {
    console.error('Error processing successful payment:', error)
    throw error
  }
}

/**
 * Handle failed/cancelled payment
 */
async function handleFailedPayment(
  order: any,
  notification: MidtransNotification
) {
  try {
    await db.$transaction(async (tx) => {
      // 1. Update order status
      await tx.order.update({
        where: { id: order.id },
        data: {
          status: 'CANCELLED',
          midtransTransactionId: notification.transaction_id,
          paymentMethod: notification.payment_type,
          updatedAt: new Date()
        }
      })

      // 2. Restore ticket availability
      for (const item of order.items) {
        await tx.ticketType.update({
          where: { id: item.ticketTypeId },
          data: {
            soldQuantity: {
              decrement: item.quantity
            }
          }
        })
      }

      console.log('Restored ticket availability for cancelled order:', order.id)
    })

    // 3. Send cancellation email (optional)
    try {
      await sendEmail({
        to: order.user.email,
        subject: `Pesanan Dibatalkan - Order #${order.id}`,
        template: 'order-cancelled',
        data: {
          name: order.user.name || 'User',
          orderId: order.id
        }
      })
    } catch (emailError) {
      console.error('Failed to send cancellation email:', emailError)
    }

    console.log('Payment cancelled for order:', order.id)
  } catch (error) {
    console.error('Error processing failed payment:', error)
    throw error
  }
}

/**
 * GET endpoint for testing (should be disabled in production)
 */
async function getHandler() {
  return NextResponse.json({
    message: 'Midtrans webhook endpoint',
    status: 'active'
  })
}

// Apply rate limiting: 100 requests per minute per IP
export const POST = withRateLimit(handler, {
  maxRequests: 100,
  windowMs: 60 * 1000 // 1 minute
})

export const GET = withRateLimit(getHandler, {
  maxRequests: 100,
  windowMs: 60 * 1000
})
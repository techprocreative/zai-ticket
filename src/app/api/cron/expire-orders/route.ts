import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { sendEmail } from '@/lib/email'
import { withRateLimit } from '@/lib/rate-limit'

/**
 * Cron Job: Expire Pending Orders
 *
 * This endpoint should be called periodically (every 5 minutes) to:
 * 1. Find all PENDING orders that have expired
 * 2. Cancel them and restore ticket availability
 * 3. Send cancellation emails (optional)
 *
 * Setup with Vercel Cron by adding to vercel.json
 * Or use external cron service with authentication
 *
 * Security: Protected by CRON_SECRET and rate limiting (10 req/min)
 */
async function handler(request: NextRequest) {
  try {
    // Simple authentication (optional but recommended)
    const authHeader = request.headers.get('authorization')
    const cronSecret = process.env.CRON_SECRET

    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const now = new Date()

    // Find expired pending orders
    const expiredOrders = await db.order.findMany({
      where: {
        status: 'PENDING',
        expiresAt: {
          lt: now
        }
      },
      include: {
        items: {
          include: {
            ticketType: true
          }
        },
        user: true,
        event: true
      }
    })

    console.log(`Found ${expiredOrders.length} expired orders to process`)

    let successCount = 0
    let errorCount = 0

    // Process each expired order
    for (const order of expiredOrders) {
      try {
        await db.$transaction(async (tx) => {
          // 1. Update order status to CANCELLED
          await tx.order.update({
            where: { id: order.id },
            data: {
              status: 'CANCELLED',
              updatedAt: now
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

          // 3. Update event capacity
          const totalTickets = order.items.reduce((sum, item) => sum + item.quantity, 0)
          await tx.event.update({
            where: { id: order.eventId },
            data: {
              currentCapacity: {
                decrement: totalTickets
              }
            }
          })
        })

        // 4. Send cancellation email (optional, don't fail cron if email fails)
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
          console.error(`Failed to send email for order ${order.id}:`, emailError)
          // Continue processing other orders even if email fails
        }

        successCount++
        console.log(`Expired order ${order.id} - Cancelled successfully`)

      } catch (error) {
        errorCount++
        console.error(`Failed to process expired order ${order.id}:`, error)
      }
    }

    const result = {
      success: true,
      timestamp: now.toISOString(),
      processed: expiredOrders.length,
      successful: successCount,
      failed: errorCount,
      message: `Processed ${expiredOrders.length} expired orders (${successCount} successful, ${errorCount} failed)`
    }

    console.log('Cron job completed:', result)

    return NextResponse.json(result)

  } catch (error) {
    console.error('Cron job error:', error)
    return NextResponse.json(
      { 
        success: false,
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

/**
 * POST endpoint for manual triggering (admin only)
 */
async function postHandler(request: NextRequest) {
  return handler(request)
}

// Apply strict rate limiting: 10 requests per minute (global, not per IP)
// This prevents abuse even if CRON_SECRET is compromised
export const GET = withRateLimit(handler, {
  maxRequests: 10,
  windowMs: 60 * 1000 // 1 minute
})

export const POST = withRateLimit(postHandler, {
  maxRequests: 10,
  windowMs: 60 * 1000
})
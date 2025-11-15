import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    // Update order status to PAID
    const order = await db.order.update({
      where: {
        id
      },
      data: {
        status: 'PAID',
        paymentId: `PAY-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
      },
      include: {
        user: true,
        event: true,
        tickets: {
          include: {
            ticketType: true
          }
        }
      }
    })

    // Here you would typically:
    // 1. Send confirmation email to user
    // 2. Send SMS notification
    // 3. Update analytics
    // 4. Notify event organizers
    
    // For now, we'll just log the confirmation
    console.log(`Payment confirmed for order ${order.id}`)
    console.log(`User: ${order.user.email}`)
    console.log(`Event: ${order.event.title}`)
    console.log(`Tickets: ${order.tickets.length}`)

    return NextResponse.json({ 
      message: 'Payment confirmed successfully',
      order 
    })
  } catch (error) {
    console.error('Failed to confirm payment:', error)
    return NextResponse.json(
      { error: 'Failed to confirm payment' },
      { status: 500 }
    )
  }
}
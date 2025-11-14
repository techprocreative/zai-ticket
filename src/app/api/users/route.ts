import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email, name, phone } = body

    if (!email) {
      return NextResponse.json(
        { error: 'Email is required' },
        { status: 400 }
      )
    }

    // Check if user already exists
    let user = await db.user.findUnique({
      where: { email }
    })

    // If user doesn't exist, create new user
    if (!user) {
      user = await db.user.create({
        data: {
          email,
          name: name || null,
          phone: phone || null,
          role: 'USER'
        }
      })
    } else {
      // Update existing user data if provided
      user = await db.user.update({
        where: { email },
        data: {
          ...(name && { name }),
          ...(phone && { phone })
        }
      })
    }

    return NextResponse.json(user)
  } catch (error) {
    console.error('Failed to create/update user:', error)
    return NextResponse.json(
      { error: 'Failed to create/update user' },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const email = searchParams.get('email')

    if (!email) {
      return NextResponse.json(
        { error: 'Email parameter is required' },
        { status: 400 }
      )
    }

    const user = await db.user.findUnique({
      where: { email },
      include: {
        orders: {
          include: {
            event: true,
            tickets: true
          },
          orderBy: {
            createdAt: 'desc'
          }
        },
        tickets: {
          include: {
            event: true,
            ticketType: true,
            order: true
          },
          orderBy: {
            createdAt: 'desc'
          }
        }
      }
    })

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    return NextResponse.json(user)
  } catch (error) {
    console.error('Failed to fetch user:', error)
    return NextResponse.json(
      { error: 'Failed to fetch user' },
      { status: 500 }
    )
  }
}
import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

const ALLOWED_ROLES = ['ADMIN', 'GATE_OPERATOR']

const isAuthorized = (role?: string | null) =>
  !!role && ALLOWED_ROLES.includes(role)

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const includeAll = searchParams.get('all') === 'true'
    const slides = await db.heroSlide.findMany({
      where: includeAll ? {} : { isActive: true },
      orderBy: { sortOrder: 'asc' }
    })

    return NextResponse.json(slides)
  } catch (error) {
    console.error('Failed to fetch slides:', error)
    return NextResponse.json({ error: 'Failed to fetch slides' }, { status: 500 })
  }
}

async function getUserRole(request: NextRequest) {
  try {
    const userHeader = request.headers.get('x-user')
    if (!userHeader) return null

    const user = JSON.parse(userHeader)
    return user?.role || null
  } catch (error) {
    console.error('Failed to resolve user role:', error)
    return null
  }
}

export async function POST(request: NextRequest) {
  try {
    const userRole = await getUserRole(request)
    if (!isAuthorized(userRole)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const data = await request.json()
    const newSlide = await db.heroSlide.create({ data })
    return NextResponse.json(newSlide, { status: 201 })
  } catch (error) {
    console.error('Failed to create slide:', error)
    return NextResponse.json({ error: 'Failed to create slide' }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const userRole = await getUserRole(request)
    if (!isAuthorized(userRole)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id, ...data } = await request.json()

    if (!id) {
      return NextResponse.json({ error: 'Slide ID is required' }, { status: 400 })
    }

    const slide = await db.heroSlide.update({
      where: { id },
      data
    })

    return NextResponse.json(slide)
  } catch (error) {
    console.error('Failed to update slide:', error)
    return NextResponse.json({ error: 'Failed to update slide' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const userRole = await getUserRole(request)
    if (!isAuthorized(userRole)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json({ error: 'Slide ID is required' }, { status: 400 })
    }

    await db.heroSlide.delete({ where: { id } })
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Failed to delete slide:', error)
    return NextResponse.json({ error: 'Failed to delete slide' }, { status: 500 })
  }
}

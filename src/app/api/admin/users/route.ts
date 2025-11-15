import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { requireRole, sanitizeUser } from '@/lib/auth-utils'

export async function GET(request: NextRequest) {
  try {
    // Only ADMIN can list all users
    await requireRole(['ADMIN'])

    const users = await prisma.user.findMany({
      orderBy: { createdAt: 'desc' },
      take: 50
    })

    // Remove passwords from response
    const sanitizedUsers = users.map(sanitizeUser)

    return NextResponse.json(sanitizedUsers)
  } catch (error) {
    if (error instanceof Error) {
      if (error.message.includes('Unauthorized')) {
        return NextResponse.json({ error: error.message }, { status: 401 })
      }
      if (error.message.includes('Forbidden')) {
        return NextResponse.json({ error: error.message }, { status: 403 })
      }
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

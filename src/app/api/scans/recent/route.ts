import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const limit = parseInt(searchParams.get('limit') || '50')

    const recentScans = await db.gateScan.findMany({
      take: limit,
      orderBy: {
        scanTime: 'desc'
      },
      include: {
        ticket: {
          include: {
            event: {
              select: {
                id: true,
                title: true
              }
            },
            ticketType: {
              select: {
                id: true,
                name: true
              }
            },
            user: {
              select: {
                id: true,
                name: true,
                email: true
              }
            }
          }
        },
        gateEntry: {
          select: {
            id: true,
            name: true,
            location: true
          }
        }
      }
    })

    return NextResponse.json(recentScans)
  } catch (error) {
    console.error('Failed to fetch recent scans:', error)
    return NextResponse.json(
      { error: 'Failed to fetch recent scans' },
      { status: 500 }
    )
  }
}
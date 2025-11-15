import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { GateEntry } from '@prisma/client'

export async function POST(request: NextRequest) {
  try {
    // Get all events to create gate entries for them
    const events = await db.event.findMany({
      select: {
        id: true,
        title: true
      }
    })

    const gateEntries: GateEntry[] = []
    
    for (const event of events) {
      // Create multiple gate entries for each event
      const gates = [
        {
          eventId: event.id,
          name: `Main Gate - ${event.title}`,
          location: 'Utama'
        },
        {
          eventId: event.id,
          name: `VIP Gate - ${event.title}`,
          location: 'VIP Area'
        },
        {
          eventId: event.id,
          name: `Staff Gate - ${event.title}`,
          location: 'Backstage'
        }
      ]

      for (const gateData of gates) {
        const gate = await db.gateEntry.create({
          data: gateData
        })
        gateEntries.push(gate)
      }
    }

    return NextResponse.json({
      message: 'Sample gate entries created successfully',
      gateEntries
    })
  } catch (error) {
    console.error('Failed to create sample gate entries:', error)
    return NextResponse.json(
      { error: 'Failed to create sample gate entries' },
      { status: 500 }
    )
  }
}
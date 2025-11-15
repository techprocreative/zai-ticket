import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { Event, TicketType } from '@prisma/client'

export async function POST(request: NextRequest) {
  try {
    // Create sample events
    const events = [
      {
        title: "Konser Musik Festival 2024",
        description: "Festival musik tahunan dengan artis lokal dan internasional. Nikmati pengalaman musik yang tak terlupakan dengan berbagai genre dari pop, rock, hingga elektronik.",
        venue: "Gelora Bung Karno Stadium",
        address: "Jakarta Pusat, DKI Jakarta",
        startDate: new Date("2024-12-15T18:00:00Z"),
        endDate: new Date("2024-12-16T00:00:00Z"),
        maxCapacity: 50000,
        status: "UPCOMING",
        imageUrl: "https://images.unsplash.com/photo-1459749411175-04bf5292ceea?w=800&h=400&fit=crop",
        ticketTypes: [
          {
            name: "Festival Pass",
            description: "Akses 2 hari penuh",
            price: 1500000,
            maxQuantity: 10000
          },
          {
            name: "Day Pass",
            description: "Akses 1 hari",
            price: 850000,
            maxQuantity: 20000
          },
          {
            name: "VIP Pass",
            description: "Akses VIP + meet & greet",
            price: 3500000,
            maxQuantity: 500
          }
        ]
      },
      {
        title: "Tech Conference 2024",
        description: "Konferensi teknologi terbesar di Indonesia dengan pembicara internasional. Pelajari tren terbaru dalam AI, blockchain, dan teknologi cloud.",
        venue: "Indonesia Convention Exhibition",
        address: "BSD City, Tangerang Selatan",
        startDate: new Date("2024-11-20T09:00:00Z"),
        endDate: new Date("2024-11-21T18:00:00Z"),
        maxCapacity: 5000,
        status: "UPCOMING",
        imageUrl: "https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=800&h=400&fit=crop",
        ticketTypes: [
          {
            name: "Early Bird",
            description: "Harga spesial pendaftaran awal",
            price: 750000,
            maxQuantity: 1000
          },
          {
            name: "Regular Pass",
            description: "Akses 2 hari konferensi",
            price: 1200000,
            maxQuantity: 3000
          },
          {
            name: "Workshop Pass",
            description: "Konferensi + workshop hands-on",
            price: 2000000,
            maxQuantity: 500
          }
        ]
      },
      {
        title: "Food & Beverage Expo",
        description: "Pameran kuliner terbesar dengan ribuan stan makanan dan minuman. Dari street food hingga fine dining, semuanya ada di sini!",
        venue: "Jakarta International Expo",
        address: "Kemayoran, Jakarta Pusat",
        startDate: new Date("2024-10-25T10:00:00Z"),
        endDate: new Date("2024-10-27T22:00:00Z"),
        maxCapacity: 25000,
        status: "UPCOMING",
        imageUrl: "https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=800&h=400&fit=crop",
        ticketTypes: [
          {
            name: "Daily Pass",
            description: "Akses 1 hari",
            price: 50000,
            maxQuantity: 10000
          },
          {
            name: "3-Day Pass",
            description: "Akses 3 hari",
            price: 120000,
            maxQuantity: 5000
          },
          {
            name: "Foodie Pass",
            description: "Akses + voucher makanan Rp 100k",
            price: 150000,
            maxQuantity: 2000
          }
        ]
      },
      {
        title: "Stand-up Comedy Night",
        description: "Malam komedi dengan komika terkenal Indonesia. Siapkan perut Anda untuk tertawa sepuasnya!",
        venue: "Theater Jakarta",
        address: "Senayan, Jakarta Pusat",
        startDate: new Date("2024-11-10T19:00:00Z"),
        endDate: new Date("2024-11-10T22:00:00Z"),
        maxCapacity: 1000,
        status: "UPCOMING",
        imageUrl: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=800&h=400&fit=crop",
        ticketTypes: [
          {
            name: "Regular Seat",
            description: "Kursi regular",
            price: 150000,
            maxQuantity: 600
          },
          {
            name: "VIP Seat",
            description: "Kursi VIP depan",
            price: 350000,
            maxQuantity: 200
          },
          {
            name: "VVIP Seat",
            description: "Kursi VVIP + meet & greet",
            price: 750000,
            maxQuantity: 50
          }
        ]
      },
      {
        title: "Marathon Jakarta 2024",
        description: "Marathon tahunan Jakarta dengan kategori 5K, 10K, half marathon, dan full marathon. Daftar sekarang dan dapatkan medali eksklusif!",
        venue: "Monas Area",
        address: "Monas, Jakarta Pusat",
        startDate: new Date("2024-12-01T05:00:00Z"),
        endDate: new Date("2024-12-01T12:00:00Z"),
        maxCapacity: 15000,
        status: "UPCOMING",
        imageUrl: "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=800&h=400&fit=crop",
        ticketTypes: [
          {
            name: "Fun Run 5K",
            description: "Lari santai 5 kilometer",
            price: 250000,
            maxQuantity: 5000
          },
          {
            name: "10K Run",
            description: "Lari 10 kilometer",
            price: 350000,
            maxQuantity: 4000
          },
          {
            name: "Half Marathon",
            description: "Lari 21.1 kilometer",
            price: 550000,
            maxQuantity: 3000
          },
          {
            name: "Full Marathon",
            description: "Lari 42.2 kilometer",
            price: 750000,
            maxQuantity: 2000
          }
        ]
      }
    ]

    const createdEvents: (Event & { ticketTypes: TicketType[] })[] = []
    
    for (const eventData of events) {
      const event = await db.event.create({
        data: {
          title: eventData.title,
          description: eventData.description,
          venue: eventData.venue,
          address: eventData.address,
          startDate: eventData.startDate,
          endDate: eventData.endDate,
          maxCapacity: eventData.maxCapacity,
          status: eventData.status as any,
          imageUrl: eventData.imageUrl,
          ticketTypes: {
            create: eventData.ticketTypes.map(type => ({
              name: type.name,
              description: type.description,
              price: type.price,
              maxQuantity: type.maxQuantity
            }))
          }
        },
        include: {
          ticketTypes: true
        }
      })
      
      createdEvents.push(event)
    }

    return NextResponse.json({
      message: 'Sample events created successfully',
      events: createdEvents
    })
  } catch (error) {
    console.error('Failed to create sample events:', error)
    return NextResponse.json(
      { error: 'Failed to create sample events' },
      { status: 500 }
    )
  }
}
import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

const SAMPLE_SLIDES = [
  {
    id: 'hero-sample-1',
    title: 'Festival Musik Nusantara 2025',
    subtitle: 'Rayakan keberagaman musik Indonesia dengan lebih dari 30 penampil.',
    imageUrl: 'https://images.unsplash.com/photo-1489515217757-5fd1be406fef',
    ctaLabel: 'Beli Tiket',
    ctaLink: '/event/festival-musik-nusantara',
    sortOrder: 0,
    isActive: true
  },
  {
    id: 'hero-sample-2',
    title: 'Tech Conference Asia 2025',
    subtitle: 'Belajar langsung dari para pemimpin teknologi dan inovator dunia.',
    imageUrl: 'https://images.unsplash.com/photo-1515165562835-c4c1bfa2b33b',
    ctaLabel: 'Daftar Sekarang',
    ctaLink: '/event/tech-conference-asia',
    sortOrder: 1,
    isActive: true
  },
  {
    id: 'hero-sample-3',
    title: 'Marathon Jakarta 10K',
    subtitle: 'Tantang dirimu dan raih medali di jalur ikonik ibu kota.',
    imageUrl: 'https://images.unsplash.com/photo-1508606572321-901ea443707f',
    ctaLabel: 'Lihat Detail',
    ctaLink: '/event/jakarta-marathon',
    sortOrder: 2,
    isActive: true
  }
]

const ADMIN_ONLY_ROLES = ['ADMIN']

const getUserRole = async (request: NextRequest) => {
  try {
    const userHeader = request.headers.get('x-user')
    if (!userHeader) return null
    const user = JSON.parse(userHeader)
    return user?.role ?? null
  } catch (error) {
    console.error('Failed to parse user header:', error)
    return null
  }
}

export async function POST(request: NextRequest) {
  try {
    const role = await getUserRole(request)
    if (!role || !ADMIN_ONLY_ROLES.includes(role)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json().catch(() => ({})) as { reset?: boolean }

    if (body?.reset) {
      await db.heroSlide.deleteMany()
    }

    const results = []
    for (const slide of SAMPLE_SLIDES) {
      const { id, ...data } = slide
      const upserted = await db.heroSlide.upsert({
        where: { id },
        update: data,
        create: { id, ...data }
      })
      results.push(upserted)
    }

    return NextResponse.json({
      success: true,
      seeded: results.length,
      reset: Boolean(body?.reset)
    })
  } catch (error) {
    console.error('Failed to seed hero slides:', error)
    return NextResponse.json({ error: 'Failed to seed hero slides' }, { status: 500 })
  }
}

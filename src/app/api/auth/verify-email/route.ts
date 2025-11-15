import { NextRequest, NextResponse } from 'next/server'
import { verifyEmailToken } from '@/lib/verification'
import { z } from 'zod'

const verifySchema = z.object({
  token: z.string().min(1, 'Token diperlukan')
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { token } = verifySchema.parse(body)

    const user = await verifyEmailToken(token)

    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Token tidak valid atau sudah kadaluarsa' },
        { status: 400 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Email berhasil diverifikasi'
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: error.issues[0].message },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { success: false, error: 'Terjadi kesalahan' },
      { status: 500 }
    )
  }
}

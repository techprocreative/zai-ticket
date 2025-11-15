import { NextRequest, NextResponse } from 'next/server'
import { resetPassword } from '@/lib/verification'
import { withRateLimit } from '@/lib/rate-limit'
import { z } from 'zod'

const resetPasswordSchema = z.object({
  token: z.string().min(1, 'Token diperlukan'),
  password: z.string().min(6, 'Password minimal 6 karakter')
})

async function handler(request: NextRequest) {
  try {
    const body = await request.json()
    const { token, password } = resetPasswordSchema.parse(body)

    const result = await resetPassword(token, password)

    if (!result.success) {
      return NextResponse.json(
        { error: result.error },
        { status: 400 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Password berhasil direset'
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.issues[0].message },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: 'Terjadi kesalahan' },
      { status: 500 }
    )
  }
}

// Apply rate limiting: 5 requests per minute per IP to prevent brute force
export const POST = withRateLimit(handler, {
  maxRequests: 5,
  windowMs: 60 * 1000 // 1 minute
})

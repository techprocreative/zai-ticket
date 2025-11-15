import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { createPasswordResetToken } from '@/lib/verification'
import { sendEmail } from '@/lib/email'
import { withRateLimit } from '@/lib/rate-limit'
import { z } from 'zod'

const forgotPasswordSchema = z.object({
  email: z.string().email('Email tidak valid')
})

async function handler(request: NextRequest) {
  try {
    const body = await request.json()
    const { email } = forgotPasswordSchema.parse(body)

    // Check if user exists
    const user = await prisma.user.findUnique({
      where: { email }
    })

    // Always return success (don't reveal if email exists)
    // But only send email if user found
    if (user) {
      const token = await createPasswordResetToken(email)
      const resetUrl = `${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/reset-password?token=${token}`

      await sendEmail({
        to: email,
        subject: 'Reset Password Anda',
        template: 'password-reset',
        data: {
          name: user.name || 'User',
          resetUrl
        }
      })
    }

    return NextResponse.json({
      success: true,
      message: 'Jika email terdaftar, link reset password akan dikirim'
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

// Apply rate limiting: max 3 requests per 15 minutes per IP
export const POST = withRateLimit(handler, {
  maxRequests: 3,
  windowMs: 15 * 60 * 1000
})

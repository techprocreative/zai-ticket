import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { hashPassword, sanitizeUser } from '@/lib/auth-utils'
import { registerSchema, validateRequest } from '@/lib/validations'
import { createVerificationToken } from '@/lib/verification'
import { sendEmail } from '@/lib/email'
import { withRateLimit } from '@/lib/rate-limit'

async function handler(request: NextRequest) {
  try {
    const body = await request.json()

    // Validate input
    const validation = validateRequest(registerSchema, body)
    if (!validation.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: validation.errors },
        { status: 400 }
      )
    }

    const { email, password, name, phone } = validation.data

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email },
    })

    if (existingUser) {
      return NextResponse.json(
        { error: 'Email sudah terdaftar' },
        { status: 409 }
      )
    }

    // Hash password
    const hashedPassword = await hashPassword(password)

    // Create user
    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        name,
        phone,
        role: 'USER',
      },
    })

    // Send verification email
    const token = await createVerificationToken(email)
    const verificationUrl = `${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/verify-email?token=${token}`

    await sendEmail({
      to: email,
      subject: 'Verifikasi Email Anda',
      template: 'verification',
      data: {
        name: name || email,
        verificationUrl
      }
    })

    // Return user without password
    return NextResponse.json(
      {
        message: 'Pendaftaran berhasil! Silakan cek email untuk verifikasi.',
        user: sanitizeUser(user),
      },
      { status: 201 }
    )
  } catch (error) {
    console.error('Registration error:', error)
    return NextResponse.json(
      { error: 'Terjadi kesalahan saat registrasi' },
      { status: 500 }
    )
  }
}

// Apply rate limiting: 5 requests per minute per IP to prevent spam registrations
export const POST = withRateLimit(handler, {
  maxRequests: 5,
  windowMs: 60 * 1000 // 1 minute
})

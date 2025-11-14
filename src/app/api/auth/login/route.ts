import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { randomBytes } from 'crypto'

// Demo users untuk testing
const DEMO_USERS = {
  'user@demo.com': {
    password: 'password123',
    role: 'USER',
    name: 'Demo User',
    id: 'demo-user-id'
  },
  'staff@demo.com': {
    password: 'staff123',
    role: 'GATE_OPERATOR',
    name: 'Demo Staff',
    id: 'demo-staff-id'
  },
  'admin@demo.com': {
    password: 'admin123',
    role: 'ADMIN',
    name: 'Demo Admin',
    id: 'demo-admin-id'
  }
}

export async function POST(request: NextRequest) {
  try {
    const { email, password, role } = await request.json()

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email dan password harus diisi' },
        { status: 400 }
      )
    }

    // Check demo users
    const demoUser = DEMO_USERS[email as keyof typeof DEMO_USERS]
    
    if (demoUser && demoUser.password === password) {
      // Generate JWT token (simplified untuk demo)
      const token = randomBytes(32).toString('hex')
      
      // Get user from database jika ada, atau buat baru
      let user = await db.user.findUnique({
        where: { email },
        select: {
          id: true,
          email: true,
          name: true,
          role: true,
          phone: true
        }
      })

      if (!user) {
        user = await db.user.create({
          data: {
            email,
            name: demoUser.name,
            role: demoUser.role as any,
            phone: null
          }
        })
      }

      return NextResponse.json({
        message: 'Login berhasil',
        token,
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          phone: user.phone
        }
      })
    } else {
      return NextResponse.json(
        { error: 'Email atau password salah' },
        { status: 401 }
      )
    }
  } catch (error) {
    console.error('Login error:', error)
    return NextResponse.json(
      { error: 'Terjadi kesalahan server' },
      { status: 500 }
    )
  }
}
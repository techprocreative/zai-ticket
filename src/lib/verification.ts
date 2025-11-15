import { prisma } from './db'
import { generateToken, hashPassword } from './auth-utils'

/**
 * Create email verification token for user
 * Token expires in 24 hours
 */
export async function createVerificationToken(email: string) {
  const token = generateToken()
  const expires = new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 hours

  await prisma.verificationToken.create({
    data: {
      identifier: email,
      token,
      expires
    }
  })

  return token
}

/**
 * Verify token and mark email as verified
 * Returns user if successful, null if token invalid/expired
 */
export async function verifyEmailToken(token: string) {
  const verificationToken = await prisma.verificationToken.findUnique({
    where: { token }
  })

  if (!verificationToken) {
    return null
  }

  // Check expiration
  if (verificationToken.expires < new Date()) {
    await prisma.verificationToken.delete({
      where: { token }
    })
    return null
  }

  // Update user
  const user = await prisma.user.update({
    where: { email: verificationToken.identifier },
    data: { emailVerified: new Date() }
  })

  // Delete token after use
  await prisma.verificationToken.delete({
    where: { token }
  })

  return user
}

/**
 * Create password reset token
 * Token expires in 1 hour (shorter than email verification)
 */
export async function createPasswordResetToken(email: string) {
  const token = generateToken()
  const expires = new Date(Date.now() + 60 * 60 * 1000) // 1 hour

  // Delete any existing reset tokens for this email
  await prisma.verificationToken.deleteMany({
    where: {
      identifier: email
    }
  })

  await prisma.verificationToken.create({
    data: {
      identifier: email,
      token,
      expires
    }
  })

  return token
}

/**
 * Verify reset token and update password
 */
export async function resetPassword(token: string, newPassword: string) {
  const verificationToken = await prisma.verificationToken.findUnique({
    where: { token }
  })

  if (!verificationToken || verificationToken.expires < new Date()) {
    return { success: false, error: 'Token tidak valid atau sudah kadaluarsa' }
  }

  // Hash new password
  const hashedPassword = await hashPassword(newPassword)

  // Update user password
  await prisma.user.update({
    where: { email: verificationToken.identifier },
    data: { password: hashedPassword }
  })

  // Delete token
  await prisma.verificationToken.delete({
    where: { token }
  })

  return { success: true }
}

/**
 * Clean expired tokens (run periodically)
 */
export async function cleanExpiredTokens() {
  await prisma.verificationToken.deleteMany({
    where: {
      expires: { lt: new Date() }
    }
  })
}

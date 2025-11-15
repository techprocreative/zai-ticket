import bcrypt from 'bcryptjs'

/**
 * Hash a plain text password
 */
export async function hashPassword(password: string): Promise<string> {
  const saltRounds = 10
  return bcrypt.hash(password, saltRounds)
}

/**
 * Verify a password against a hash
 */
export async function verifyPassword(password: string, hashedPassword: string): Promise<boolean> {
  return bcrypt.compare(password, hashedPassword)
}

/**
 * Generate a random token for email verification, password reset, etc.
 */
export function generateToken(): string {
  return Math.random().toString(36).substring(2) + Date.now().toString(36)
}

/**
 * Get user role display name
 */
export function getRoleDisplayName(role: string): string {
  const roleNames: Record<string, string> = {
    ADMIN: 'Administrator',
    STAFF: 'Staff',
    USER: 'User',
    GATE_OPERATOR: 'Gate Operator',
  }
  return roleNames[role] || role
}

/**
 * Check if user has required role
 */
export function hasRole(userRole: string, requiredRoles: string[]): boolean {
  return requiredRoles.includes(userRole)
}

/**
 * Sanitize user object (remove sensitive fields)
 */
export function sanitizeUser<T extends { password?: string | null; [key: string]: any }>(user: T): Omit<T, 'password'> {
  const { password, ...sanitized } = user
  return sanitized
}

import { getServerSession } from 'next-auth'
import { authOptions } from './auth'
import type { UserRole } from '@prisma/client'

/**
 * Get current session with proper typing (server-side only)
 */
export async function getCurrentUser() {
  const session = await getServerSession(authOptions)
  return session?.user ?? null
}

/**
 * Throw error if user not authenticated
 */
export async function requireAuth() {
  const user = await getCurrentUser()
  if (!user) {
    throw new Error('Unauthorized: Authentication required')
  }
  return user
}

/**
 * Throw error if user doesn't have required role
 */
export async function requireRole(allowedRoles: UserRole[]) {
  const user = await requireAuth()
  if (!hasRole(user.role, allowedRoles)) {
    throw new Error(
      `Forbidden: Required role ${allowedRoles.join(' or ')}, but user has ${user.role}`
    )
  }
  return user
}

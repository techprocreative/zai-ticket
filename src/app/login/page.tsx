'use client'

import { useState } from 'react'
import { signIn } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Mail, Lock, User, Eye, EyeOff, Ticket, Users, Shield, AlertCircle } from 'lucide-react'
import { Alert, AlertDescription } from '@/components/ui/alert'
import Link from 'next/link'
import { ThemeToggle } from '@/components/theme-toggle'

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [loginType, setLoginType] = useState<'user' | 'admin' | 'staff'>('user')

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const result = await signIn('credentials', {
        email,
        password,
        redirect: false,
      })

      if (result?.error) {
        setError(result.error)
      } else if (result?.ok) {
        // Redirect based on role - we'll check role after login
        // For now, redirect to home page
        router.push('/')
        router.refresh()
      }
    } catch (error) {
      console.error('Login error:', error)
      setError('Terjadi kesalahan. Silakan coba lagi.')
    } finally {
      setLoading(false)
    }
  }

  const getLoginTypeIcon = () => {
    switch (loginType) {
      case 'admin':
        return <Shield className="h-5 w-5" />
      case 'staff':
        return <Users className="h-5 w-5" />
      default:
        return <User className="h-5 w-5" />
    }
  }

  const getLoginTypeTitle = () => {
    switch (loginType) {
      case 'admin':
        return 'Admin Login'
      case 'staff':
        return 'Staff Login'
      default:
        return 'User Login'
    }
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center space-x-2 mb-4">
            <h1 className="text-2xl font-bold">TiketKu</h1>
            <Badge variant="outline">Online Ticketing</Badge>
          </div>
          <p className="text-muted-foreground">
            Masuk ke akun Anda untuk melanjutkan
          </p>
        </div>

        {/* Login Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-center space-x-2">
              {getLoginTypeIcon()}
              <span>{getLoginTypeTitle()}</span>
            </CardTitle>
            <CardDescription>
              {loginType === 'admin' && 'Akses admin panel untuk manajemen event'}
              {loginType === 'staff' && 'Akses gate entry untuk validasi tiket'}
              {loginType === 'user' && 'Akses dashboard tiket Anda'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {/* Login Type Tabs */}
            <Tabs value={loginType} onValueChange={(value) => setLoginType(value as any)} className="mb-6">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="user" className="flex items-center space-x-2">
                  <User className="h-4 w-4" />
                  <span className="hidden sm:inline">User</span>
                </TabsTrigger>
                <TabsTrigger value="staff" className="flex items-center space-x-2">
                  <Users className="h-4 w-4" />
                  <span className="hidden sm:inline">Staff</span>
                </TabsTrigger>
                <TabsTrigger value="admin" className="flex items-center space-x-2">
                  <Shield className="h-4 w-4" />
                  <span className="hidden sm:inline">Admin</span>
                </TabsTrigger>
              </TabsList>

              <TabsContent value="user" className="mt-0">
                <form onSubmit={handleLogin} className="space-y-4">
                  {error && (
                    <Alert variant="destructive">
                      <AlertCircle className="h-4 w-4" />
                      <AlertDescription>{error}</AlertDescription>
                    </Alert>
                  )}
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="email@example.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="password">Password</Label>
                    <div className="relative">
                      <Input
                        id="password"
                        type={showPassword ? "text" : "password"}
                        placeholder="Masukkan password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                        onClick={() => setShowPassword(!showPassword)}
                      >
                        {showPassword ? (
                          <EyeOff className="h-4 w-4" />
                        ) : (
                          <Eye className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                  </div>
                  <div className="flex justify-end">
                    <Link
                      href="/forgot-password"
                      className="text-sm text-blue-600 hover:underline"
                    >
                      Lupa password?
                    </Link>
                  </div>
                  <Button type="submit" className="w-full" disabled={loading}>
                    {loading ? 'Memproses...' : 'Masuk'}
                  </Button>
                </form>
              </TabsContent>

              <TabsContent value="staff" className="mt-0">
                <form onSubmit={handleLogin} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="staff-email">Email Staff</Label>
                    <Input
                      id="staff-email"
                      type="email"
                      placeholder="staff@tiketku.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="staff-password">Password</Label>
                    <div className="relative">
                      <Input
                        id="staff-password"
                        type={showPassword ? "text" : "password"}
                        placeholder="Masukkan password staff"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                        onClick={() => setShowPassword(!showPassword)}
                      >
                        {showPassword ? (
                          <EyeOff className="h-4 w-4" />
                        ) : (
                          <Eye className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                  </div>
                  <div className="flex justify-end">
                    <Link
                      href="/forgot-password"
                      className="text-sm text-blue-600 hover:underline"
                    >
                      Lupa password?
                    </Link>
                  </div>
                  <Button type="submit" className="w-full" disabled={loading}>
                    {loading ? 'Memproses...' : 'Masuk sebagai Staff'}
                  </Button>
                </form>
              </TabsContent>

              <TabsContent value="admin" className="mt-0">
                <form onSubmit={handleLogin} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="admin-email">Email Admin</Label>
                    <Input
                      id="admin-email"
                      type="email"
                      placeholder="admin@tiketku.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="admin-password">Password Admin</Label>
                    <div className="relative">
                      <Input
                        id="admin-password"
                        type={showPassword ? "text" : "password"}
                        placeholder="Masukkan password admin"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                        onClick={() => setShowPassword(!showPassword)}
                      >
                        {showPassword ? (
                          <EyeOff className="h-4 w-4" />
                        ) : (
                          <Eye className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                  </div>
                  <div className="flex justify-end">
                    <Link
                      href="/forgot-password"
                      className="text-sm text-blue-600 hover:underline"
                    >
                      Lupa password?
                    </Link>
                  </div>
                  <Button type="submit" className="w-full" disabled={loading}>
                    {loading ? 'Memproses...' : 'Masuk sebagai Admin'}
                  </Button>
                </form>
              </TabsContent>
            </Tabs>

            <Separator className="my-4" />

            {/* Demo Accounts */}
            <div className="space-y-3">
              <p className="text-sm text-muted-foreground text-center">
                Akun Demo (untuk testing):
              </p>
              <div className="grid grid-cols-1 gap-2 text-xs">
                <div className="p-2 bg-muted rounded">
                  <p className="font-medium">User:</p>
                  <p>user@demo.com / password123</p>
                </div>
                <div className="p-2 bg-muted rounded">
                  <p className="font-medium">Staff:</p>
                  <p>staff@demo.com / staff123</p>
                </div>
                <div className="p-2 bg-muted rounded">
                  <p className="font-medium">Admin:</p>
                  <p>admin@demo.com / admin123</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Footer */}
        <div className="text-center mt-6 space-y-4">
          <div className="flex items-center justify-center space-x-4">
            <ThemeToggle />
            <Button variant="ghost" asChild>
              <Link href="/">Kembali ke Beranda</Link>
            </Button>
          </div>
          
          <div className="text-sm text-muted-foreground">
            <p>Belum punya akun?{' '}
              <Link href="/register" className="text-primary hover:underline">
                Daftar Sekarang
              </Link>
            </p>
            <p className="mt-1">
              Butuh bantuan?{' '}
              <Link href="/help" className="text-primary hover:underline">
                Hubungi Support
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
'use client'

import { useEffect, useState } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { CheckCircle, XCircle, Loader2 } from 'lucide-react'
import { Suspense } from 'react'

function VerifyEmailContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const token = searchParams?.get('token')

  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading')
  const [message, setMessage] = useState('')

  useEffect(() => {
    if (!token) {
      setStatus('error')
      setMessage('Token verifikasi tidak ditemukan')
      return
    }

    fetch('/api/auth/verify-email', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token })
    })
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          setStatus('success')
          setMessage('Email berhasil diverifikasi!')
          setTimeout(() => router.push('/login'), 3000)
        } else {
          setStatus('error')
          setMessage(data.error || 'Verifikasi gagal')
        }
      })
      .catch(() => {
        setStatus('error')
        setMessage('Terjadi kesalahan saat verifikasi')
      })
  }, [token, router])

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle className="text-center">Verifikasi Email</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {status === 'loading' && (
          <div className="flex flex-col items-center space-y-4">
            <Loader2 className="h-12 w-12 animate-spin text-blue-500" />
            <p className="text-center text-muted-foreground">
              Memverifikasi email Anda...
            </p>
          </div>
        )}

        {status === 'success' && (
          <Alert className="border-green-200 bg-green-50">
            <CheckCircle className="h-5 w-5 text-green-600" />
            <AlertDescription className="text-green-800">
              {message}
              <br />
              <span className="text-sm">Anda akan diarahkan ke halaman login...</span>
            </AlertDescription>
          </Alert>
        )}

        {status === 'error' && (
          <div className="space-y-4">
            <Alert variant="destructive">
              <XCircle className="h-5 w-5" />
              <AlertDescription>{message}</AlertDescription>
            </Alert>
            <Button
              variant="outline"
              className="w-full"
              onClick={() => router.push('/login')}
            >
              Kembali ke Login
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

export default function VerifyEmailPage() {
  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <Suspense fallback={<div>Loading...</div>}>
        <VerifyEmailContent />
      </Suspense>
    </div>
  )
}

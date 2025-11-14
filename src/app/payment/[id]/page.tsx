'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { ArrowLeft, Clock, Copy, CheckCircle, AlertCircle } from 'lucide-react'
import Link from 'next/link'

interface Order {
  id: string
  totalAmount: number
  status: string
  paymentMethod: string
  createdAt: string
  user: {
    name: string
    email: string
  }
  event: {
    title: string
    venue: string
    startDate: string
  }
  items: {
    ticketType: {
      name: string
    }
    quantity: number
    unitPrice: number
  }[]
}

export default function Payment() {
  const params = useParams()
  const router = useRouter()
  const [order, setOrder] = useState<Order | null>(null)
  const [loading, setLoading] = useState(true)
  const [copied, setCopied] = useState(false)
  const [countdown, setCountdown] = useState(900) // 15 minutes in seconds

  useEffect(() => {
    if (params.id) {
      fetchOrder(params.id as string)
    }
  }, [params.id])

  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000)
      return () => clearTimeout(timer)
    }
  }, [countdown])

  const fetchOrder = async (orderId: string) => {
    try {
      const response = await fetch(`/api/orders/${orderId}`)
      if (!response.ok) {
        throw new Error('Order not found')
      }
      const data = await response.json()
      setOrder(data)
    } catch (error) {
      console.error('Failed to fetch order:', error)
      router.push('/')
    } finally {
      setLoading(false)
    }
  }

  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    const secs = seconds % 60
    
    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
    }
    return `${minutes}:${secs.toString().padStart(2, '0')}`
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const handlePaymentConfirmation = async () => {
    if (!order) return

    try {
      const response = await fetch(`/api/orders/${order.id}/confirm-payment`, {
        method: 'POST'
      })

      if (!response.ok) {
        throw new Error('Failed to confirm payment')
      }

      router.push(`/success/${order.id}`)
    } catch (error) {
      console.error('Payment confirmation failed:', error)
      alert('Terjadi kesalahan saat konfirmasi pembayaran. Silakan coba lagi.')
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-8">
          <div className="flex items-center justify-center min-h-96">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
              <p className="text-muted-foreground">Memuat detail pembayaran...</p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (!order) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-8">
          <div className="text-center">
            <p className="text-muted-foreground">Pesanan tidak ditemukan</p>
            <Button asChild className="mt-4">
              <Link href="/">Kembali ke Beranda</Link>
            </Button>
          </div>
        </div>
      </div>
    )
  }

  const isExpired = countdown === 0

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-card border-b sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center space-x-4">
            <Button variant="ghost" size="sm" asChild>
              <Link href="/checkout">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Kembali
              </Link>
            </Button>
            <h1 className="text-xl font-bold">Pembayaran</h1>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Payment Instructions */}
          <div className="lg:col-span-2 space-y-6">
            {/* Order Status */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center">
                    {isExpired ? (
                      <AlertCircle className="h-5 w-5 mr-2 text-destructive" />
                    ) : (
                      <Clock className="h-5 w-5 mr-2 text-primary" />
                    )}
                    Status Pembayaran
                  </CardTitle>
                  <Badge variant={isExpired ? "destructive" : "secondary"}>
                    {isExpired ? 'Kadaluarsa' : 'Menunggu Pembayaran'}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                {!isExpired ? (
                  <div className="text-center">
                    <p className="text-sm text-muted-foreground mb-2">
                      Selesaikan pembayaran dalam:
                    </p>
                    <p className="text-3xl font-bold text-primary">
                      {formatTime(countdown)}
                    </p>
                    <p className="text-sm text-muted-foreground mt-2">
                      Batas waktu: {formatDate(new Date(Date.now() + countdown * 1000).toISOString())}
                    </p>
                  </div>
                ) : (
                  <div className="text-center">
                    <p className="text-lg text-destructive font-medium">
                      Waktu pembayaran telah habis
                    </p>
                    <p className="text-sm text-muted-foreground mt-2">
                      Silakan buat pesanan baru
                    </p>
                    <Button asChild className="mt-4">
                      <Link href="/">Buat Pesanan Baru</Link>
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Payment Method */}
            <Card>
              <CardHeader>
                <CardTitle>Metode Pembayaran</CardTitle>
                <CardDescription>
                  Transfer ke rekening bank berikut:
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="border rounded-lg p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <p className="font-medium">Bank Central Asia (BCA)</p>
                      <p className="text-sm text-muted-foreground">Virtual Account</p>
                    </div>
                    <Badge variant="outline">BCA</Badge>
                  </div>
                  <div className="bg-muted p-3 rounded">
                    <p className="text-sm text-muted-foreground">Nomor Virtual Account</p>
                    <div className="flex items-center justify-between mt-1">
                      <p className="font-mono font-bold text-lg">8806 0812 3456 7890</p>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => copyToClipboard('8806081234567890')}
                      >
                        {copied ? <CheckCircle className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                      </Button>
                    </div>
                  </div>
                </div>

                <div className="border rounded-lg p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <p className="font-medium">Bank Mandiri</p>
                      <p className="text-sm text-muted-foreground">Virtual Account</p>
                    </div>
                    <Badge variant="outline">Mandiri</Badge>
                  </div>
                  <div className="bg-muted p-3 rounded">
                    <p className="text-sm text-muted-foreground">Nomor Virtual Account</p>
                    <div className="flex items-center justify-between mt-1">
                      <p className="font-mono font-bold text-lg">8806 0812 3456 7890</p>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => copyToClipboard('8806081234567890')}
                      >
                        {copied ? <CheckCircle className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Payment Instructions */}
            <Card>
              <CardHeader>
                <CardTitle>Petunjuk Pembayaran</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-start space-x-3">
                    <div className="w-6 h-6 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-sm font-bold">1</div>
                    <div>
                      <p className="font-medium">Buka aplikasi mobile banking atau ATM</p>
                      <p className="text-sm text-muted-foreground">
                        Pilih bank yang sesuai dengan metode pembayaran
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start space-x-3">
                    <div className="w-6 h-6 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-sm font-bold">2</div>
                    <div>
                      <p className="font-medium">Pilih menu Virtual Account</p>
                      <p className="text-sm text-muted-foreground">
                        Masukkan nomor virtual account yang tertera
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start space-x-3">
                    <div className="w-6 h-6 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-sm font-bold">3</div>
                    <div>
                      <p className="font-medium">Masukkan jumlah pembayaran</p>
                      <p className="text-sm text-muted-foreground">
                        Pastikan jumlah yang dibayarkan sesuai
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start space-x-3">
                    <div className="w-6 h-6 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-sm font-bold">4</div>
                    <div>
                      <p className="font-medium">Konfirmasi pembayaran</p>
                      <p className="text-sm text-muted-foreground">
                        Klik tombol "Konfirmasi Pembayaran" setelah transfer
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Action Buttons */}
            {!isExpired && (
              <div className="flex space-x-4">
                <Button 
                  className="flex-1" 
                  onClick={handlePaymentConfirmation}
                >
                  Konfirmasi Pembayaran
                </Button>
                <Button variant="outline" asChild>
                  <Link href={`/event/${order.event.title.toLowerCase().replace(/\s+/g, '-')}`}>
                    Lihat Event
                  </Link>
                </Button>
              </div>
            )}
          </div>

          {/* Order Summary */}
          <div className="lg:col-span-1">
            <Card className="sticky top-24">
              <CardHeader>
                <CardTitle>Detail Pesanan</CardTitle>
                <CardDescription>Order ID: {order.id}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h4 className="font-semibold">{order.event.title}</h4>
                  <p className="text-sm text-muted-foreground">{order.event.venue}</p>
                  <p className="text-sm text-muted-foreground">
                    {formatDate(order.event.startDate)}
                  </p>
                </div>

                <Separator />

                <div className="space-y-2">
                  {order.items.map((item, index) => (
                    <div key={index} className="flex justify-between text-sm">
                      <span>{item.ticketType.name} x {item.quantity}</span>
                      <span>Rp {(item.unitPrice * item.quantity).toLocaleString('id-ID')}</span>
                    </div>
                  ))}
                </div>

                <Separator />

                <div className="flex justify-between font-bold">
                  <span>Total Pembayaran</span>
                  <span className="text-primary">Rp {order.totalAmount.toLocaleString('id-ID')}</span>
                </div>

                <Separator />

                <div>
                  <p className="text-sm font-medium mb-2">Informasi Pembeli:</p>
                  <p className="text-sm">{order.user.name}</p>
                  <p className="text-sm text-muted-foreground">{order.user.email}</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
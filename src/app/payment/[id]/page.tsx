'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { ArrowLeft, Clock, CreditCard, AlertCircle } from 'lucide-react'
import Link from 'next/link'
import Script from 'next/script'

interface Order {
  id: string
  totalAmount: number
  status: string
  expiresAt: string
  midtransSnapToken?: string
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

// Extend window type for Snap
declare global {
  interface Window {
    snap?: {
      pay: (token: string, options?: {
        onSuccess?: (result: any) => void
        onPending?: (result: any) => void
        onError?: (result: any) => void
        onClose?: () => void
      }) => void
    }
  }
}

export default function Payment() {
  const params = useParams()
  const router = useRouter()
  const [order, setOrder] = useState<Order | null>(null)
  const [loading, setLoading] = useState(true)
  const [snapLoaded, setSnapLoaded] = useState(false)
  const [paying, setPaying] = useState(false)
  const [timeLeft, setTimeLeft] = useState(0)

  // Calculate time left from expiresAt
  useEffect(() => {
    if (!order?.expiresAt) return

    const calculateTimeLeft = () => {
      const now = new Date().getTime()
      const expiry = new Date(order.expiresAt).getTime()
      const diff = expiry - now
      return Math.max(0, Math.floor(diff / 1000))
    }

    setTimeLeft(calculateTimeLeft())
    const interval = setInterval(() => {
      const left = calculateTimeLeft()
      setTimeLeft(left)
      if (left === 0) {
        clearInterval(interval)
      }
    }, 1000)

    return () => clearInterval(interval)
  }, [order?.expiresAt])

  useEffect(() => {
    if (params?.id) {
      fetchOrder(params.id as string)
    }
  }, [params])

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

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const handlePayment = () => {
    if (!order?.midtransSnapToken || !window.snap) {
      console.error('Snap not loaded or token missing')
      return
    }

    setPaying(true)

    window.snap.pay(order.midtransSnapToken, {
      onSuccess: (result) => {
        console.log('Payment success:', result)
        router.push(`/success/${order.id}`)
      },
      onPending: (result) => {
        console.log('Payment pending:', result)
        // Keep on payment page, show pending status
        alert('Pembayaran Anda sedang diproses. Kami akan mengirimkan konfirmasi via email.')
      },
      onError: (result) => {
        console.error('Payment error:', result)
        setPaying(false)
        alert('Terjadi kesalahan saat memproses pembayaran. Silakan coba lagi.')
      },
      onClose: () => {
        console.log('Payment popup closed')
        setPaying(false)
      }
    })
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

  const isExpired = timeLeft === 0
  const isPaid = order.status === 'PAID'

  if (isPaid) {
    router.push(`/success/${order.id}`)
    return null
  }

  return (
    <>
      {/* Load Midtrans Snap.js */}
      <Script
        src={process.env.NEXT_PUBLIC_MIDTRANS_SNAP_URL || "https://app.sandbox.midtrans.com/snap/snap.js"}
        data-client-key={process.env.NEXT_PUBLIC_MIDTRANS_CLIENT_KEY}
        onLoad={() => setSnapLoaded(true)}
        strategy="lazyOnload"
      />

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
            {/* Payment Section */}
            <div className="lg:col-span-2 space-y-6">
              {/* Order Status & Timer */}
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
                        {formatTime(timeLeft)}
                      </p>
                      <p className="text-sm text-muted-foreground mt-2">
                        Batas waktu: {formatDate(order.expiresAt)}
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

              {/* Payment Button */}
              {!isExpired && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <CreditCard className="h-5 w-5 mr-2" />
                      Lanjutkan Pembayaran
                    </CardTitle>
                    <CardDescription>
                      Klik tombol di bawah untuk memilih metode pembayaran
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="bg-muted p-4 rounded-lg">
                      <h4 className="font-medium mb-2">Metode Pembayaran Tersedia:</h4>
                      <ul className="space-y-1 text-sm text-muted-foreground">
                        <li>• Virtual Account (BCA, Mandiri, BNI, BRI, Permata)</li>
                        <li>• Kartu Kredit/Debit (Visa, Mastercard, JCB)</li>
                        <li>• E-Wallet (GoPay, ShopeePay, QRIS)</li>
                        <li>• Convenience Store (Indomaret, Alfamart)</li>
                      </ul>
                    </div>

                    <Button 
                      className="w-full h-12 text-lg" 
                      size="lg"
                      onClick={handlePayment}
                      disabled={!snapLoaded || paying || !order.midtransSnapToken}
                    >
                      {paying ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                          Membuka Pembayaran...
                        </>
                      ) : !snapLoaded ? (
                        'Memuat Pembayaran...'
                      ) : (
                        <>
                          <CreditCard className="h-5 w-5 mr-2" />
                          Bayar Sekarang
                        </>
                      )}
                    </Button>

                    <p className="text-xs text-center text-muted-foreground">
                      Pembayaran aman dan terenkripsi melalui Midtrans
                    </p>
                  </CardContent>
                </Card>
              )}

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
                        <p className="font-medium">Klik tombol "Bayar Sekarang"</p>
                        <p className="text-sm text-muted-foreground">
                          Popup pembayaran akan terbuka dengan berbagai pilihan metode
                        </p>
                      </div>
                    </div>
                    <div className="flex items-start space-x-3">
                      <div className="w-6 h-6 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-sm font-bold">2</div>
                      <div>
                        <p className="font-medium">Pilih metode pembayaran</p>
                        <p className="text-sm text-muted-foreground">
                          Pilih metode yang paling sesuai dengan Anda
                        </p>
                      </div>
                    </div>
                    <div className="flex items-start space-x-3">
                      <div className="w-6 h-6 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-sm font-bold">3</div>
                      <div>
                        <p className="font-medium">Ikuti instruksi pembayaran</p>
                        <p className="text-sm text-muted-foreground">
                          Setiap metode memiliki panduan lengkap untuk pembayaran
                        </p>
                      </div>
                    </div>
                    <div className="flex items-start space-x-3">
                      <div className="w-6 h-6 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-sm font-bold">4</div>
                      <div>
                        <p className="font-medium">Selesaikan pembayaran</p>
                        <p className="text-sm text-muted-foreground">
                          Tiket akan dikirim ke email Anda setelah pembayaran berhasil
                        </p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
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
    </>
  )
}
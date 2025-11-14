'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import { Badge } from '@/components/ui/badge'
import { ArrowLeft, User, Mail, Phone, CreditCard, Shield } from 'lucide-react'
import Link from 'next/link'

interface OrderItem {
  ticketTypeId: string
  quantity: number
  ticketType: {
    id: string
    name: string
    price: number
  }
}

interface OrderData {
  eventId: string
  eventTitle: string
  items: OrderItem[]
  totalAmount: number
}

export default function Checkout() {
  const router = useRouter()
  const [orderData, setOrderData] = useState<OrderData | null>(null)
  const [loading, setLoading] = useState(true)
  const [processing, setProcessing] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: ''
  })

  useEffect(() => {
    const storedOrderData = sessionStorage.getItem('orderData')
    if (!storedOrderData) {
      router.push('/')
      return
    }

    try {
      const data = JSON.parse(storedOrderData)
      setOrderData(data)
    } catch (error) {
      console.error('Failed to parse order data:', error)
      router.push('/')
    } finally {
      setLoading(false)
    }
  }, [router])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }))
  }

  const validateForm = () => {
    if (!formData.name.trim()) {
      alert('Nama lengkap harus diisi')
      return false
    }
    if (!formData.email.trim()) {
      alert('Email harus diisi')
      return false
    }
    if (!formData.phone.trim()) {
      alert('Nomor telepon harus diisi')
      return false
    }
    return true
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validateForm() || !orderData) return

    setProcessing(true)

    try {
      // Create user first or get existing user
      const userResponse = await fetch('/api/users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
      })

      if (!userResponse.ok) {
        throw new Error('Failed to create user')
      }

      const user = await userResponse.json()

      // Create order
      const orderResponse = await fetch('/api/orders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          userId: user.id,
          eventId: orderData.eventId,
          items: orderData.items.map(item => ({
            ticketTypeId: item.ticketTypeId,
            quantity: item.quantity,
            unitPrice: item.ticketType.price,
            totalPrice: item.ticketType.price * item.quantity
          })),
          totalAmount: orderData.totalAmount,
          paymentMethod: 'TRANSFER'
        })
      })

      if (!orderResponse.ok) {
        throw new Error('Failed to create order')
      }

      const order = await orderResponse.json()

      // Clear session storage
      sessionStorage.removeItem('orderData')

      // Redirect to payment page
      router.push(`/payment/${order.id}`)
    } catch (error) {
      console.error('Checkout failed:', error)
      alert('Terjadi kesalahan saat memproses pesanan. Silakan coba lagi.')
    } finally {
      setProcessing(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-8">
          <div className="flex items-center justify-center min-h-96">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
              <p className="text-muted-foreground">Memuat checkout...</p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (!orderData) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-8">
          <div className="text-center">
            <p className="text-muted-foreground">Data pesanan tidak ditemukan</p>
            <Button asChild className="mt-4">
              <Link href="/">Kembali ke Beranda</Link>
            </Button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-card border-b sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center space-x-4">
            <Button variant="ghost" size="sm" asChild>
              <Link href={`/event/${orderData.eventId}`}>
                <ArrowLeft className="h-4 w-4 mr-2" />
                Kembali
              </Link>
            </Button>
            <h1 className="text-xl font-bold">Checkout</h1>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Checkout Form */}
          <div className="lg:col-span-2">
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Event Summary */}
              <Card>
                <CardHeader>
                  <CardTitle>Ringkasan Event</CardTitle>
                </CardHeader>
                <CardContent>
                  <h3 className="font-semibold text-lg">{orderData.eventTitle}</h3>
                  <div className="mt-4 space-y-2">
                    {orderData.items.map((item, index) => (
                      <div key={index} className="flex justify-between">
                        <span>{item.ticketType.name} x {item.quantity}</span>
                        <span>Rp {(item.ticketType.price * item.quantity).toLocaleString('id-ID')}</span>
                      </div>
                    ))}
                  </div>
                  <Separator className="my-4" />
                  <div className="flex justify-between font-bold text-lg">
                    <span>Total Pembayaran</span>
                    <span className="text-primary">Rp {orderData.totalAmount.toLocaleString('id-ID')}</span>
                  </div>
                </CardContent>
              </Card>

              {/* Customer Information */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <User className="h-5 w-5 mr-2" />
                    Informasi Pembeli
                  </CardTitle>
                  <CardDescription>
                    Masukkan data diri Anda untuk melanjutkan pembelian
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Nama Lengkap *</Label>
                    <Input
                      id="name"
                      name="name"
                      type="text"
                      placeholder="Masukkan nama lengkap"
                      value={formData.name}
                      onChange={handleInputChange}
                      required
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="email">Email *</Label>
                    <Input
                      id="email"
                      name="email"
                      type="email"
                      placeholder="email@example.com"
                      value={formData.email}
                      onChange={handleInputChange}
                      required
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="phone">Nomor Telepon *</Label>
                    <Input
                      id="phone"
                      name="phone"
                      type="tel"
                      placeholder="+62 812-3456-7890"
                      value={formData.phone}
                      onChange={handleInputChange}
                      required
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Payment Method */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <CreditCard className="h-5 w-5 mr-2" />
                    Metode Pembayaran
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="border rounded-lg p-4 cursor-pointer hover:bg-accent">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium">Transfer Bank</p>
                          <p className="text-sm text-muted-foreground">
                            Transfer melalui BCA, Mandiri, BNI, atau BRI
                          </p>
                        </div>
                        <Badge variant="outline">Direkomendasikan</Badge>
                      </div>
                    </div>
                    
                    <div className="border rounded-lg p-4 cursor-pointer hover:bg-accent opacity-50">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium">E-Wallet</p>
                          <p className="text-sm text-muted-foreground">
                            GoPay, OVO, DANA, ShopeePay (Coming Soon)
                          </p>
                        </div>
                        <Badge variant="secondary">Segera Hadir</Badge>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Submit Button */}
              <Button 
                type="submit" 
                className="w-full" 
                size="lg"
                disabled={processing}
              >
                {processing ? 'Memproses...' : 'Lanjut ke Pembayaran'}
              </Button>
            </form>
          </div>

          {/* Order Summary Sidebar */}
          <div className="lg:col-span-1">
            <Card className="sticky top-24">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Shield className="h-5 w-5 mr-2" />
                  Keamanan Terjamin
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="flex items-center space-x-3">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <p className="text-sm">Pembayaran aman dan terenkripsi</p>
                  </div>
                  <div className="flex items-center space-x-3">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <p className="text-sm">Tiket digital dengan QR code</p>
                  </div>
                  <div className="flex items-center space-x-3">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <p className="text-sm">Validasi cepat di gate entry</p>
                  </div>
                  <div className="flex items-center space-x-3">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <p className="text-sm">Dukungan pelanggan 24/7</p>
                  </div>
                </div>
                
                <Separator />
                
                <div className="text-center">
                  <p className="text-sm text-muted-foreground mb-2">
                    Butuh bantuan?
                  </p>
                  <Button variant="outline" size="sm">
                    Hubungi Support
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
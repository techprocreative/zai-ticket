'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { CheckCircle, Download, Mail, Calendar, MapPin, Users, QrCode } from 'lucide-react'
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
    address: string
    startDate: string
    endDate: string
  }
  tickets: {
    id: string
    qrCode: string
    status: string
    ticketType: {
      name: string
      price: number
    }
  }[]
}

export default function Success() {
  const params = useParams()
  const router = useRouter()
  const [order, setOrder] = useState<Order | null>(null)
  const [loading, setLoading] = useState(true)
  const [downloading, setDownloading] = useState(false)

  useEffect(() => {
    if (params?.id) {
      fetchOrder(params.id as string)
    }
  }, [params?.id])

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

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const downloadTickets = async () => {
    if (!order) return

    setDownloading(true)
    try {
      // Create a simple text file with ticket information
      const ticketText = `
Tiket Event - ${order.event.title}
================================

Order ID: ${order.id}
Tanggal Pembelian: ${formatDate(order.createdAt)}
Status: ${order.status}

Informasi Event:
----------------
Judul: ${order.event.title}
Venue: ${order.event.venue}
Alamat: ${order.event.address}
Tanggal: ${formatDate(order.event.startDate)}

Informasi Pembeli:
------------------
Nama: ${order.user.name}
Email: ${order.user.email}

Detail Tiket:
------------
${order.tickets.map((ticket, index) => `
Tiket ${index + 1}:
- Tipe: ${ticket.ticketType.name}
- QR Code: ${ticket.qrCode}
- Status: ${ticket.status}
`).join('')}

Total Pembayaran: Rp ${order.totalAmount.toLocaleString('id-ID')}

================================
Simpan tiket ini sebagai bukti pembelian yang sah.
Tunjukkan QR Code di pintu masuk event.
      `.trim()

      const blob = new Blob([ticketText], { type: 'text/plain' })
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `tiket-${order.id}.txt`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
    } catch (error) {
      console.error('Failed to download tickets:', error)
      alert('Gagal mengunduh tiket. Silakan coba lagi.')
    } finally {
      setDownloading(false)
    }
  }

  const sendEmailConfirmation = async () => {
    if (!order) return

    try {
      // Here you would integrate with an email service
      // For now, we'll just show a success message
      alert(`Tiket telah dikirim ke ${order.user.email}`)
    } catch (error) {
      console.error('Failed to send email:', error)
      alert('Gagal mengirim email. Silakan coba lagi.')
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-8">
          <div className="flex items-center justify-center min-h-96">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
              <p className="text-muted-foreground">Memuat detail pesanan...</p>
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

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-card border-b">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center space-x-4">
            <h1 className="text-xl font-bold">Pembayaran Berhasil</h1>
            <Badge variant="default" className="bg-green-500">
              <CheckCircle className="h-3 w-3 mr-1" />
              Lunas
            </Badge>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto space-y-8">
          {/* Success Message */}
          <Card className="border-green-200 bg-green-50">
            <CardHeader className="text-center">
              <div className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="h-8 w-8 text-white" />
              </div>
              <CardTitle className="text-2xl text-green-800">
                Pembayaran Berhasil!
              </CardTitle>
              <CardDescription className="text-green-600">
                Terima kasih telah melakukan pembelian. Tiket Anda telah dikirim ke email.
              </CardDescription>
            </CardHeader>
          </Card>

          {/* Order Summary */}
          <Card>
            <CardHeader>
              <CardTitle>Detail Pesanan</CardTitle>
              <CardDescription>Order ID: {order.id}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h4 className="font-semibold text-lg">{order.event.title}</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                  <div className="flex items-center space-x-3">
                    <Calendar className="h-5 w-5 text-primary" />
                    <div>
                      <p className="font-medium">Tanggal & Waktu</p>
                      <p className="text-sm text-muted-foreground">
                        {formatDate(order.event.startDate)}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-3">
                    <MapPin className="h-5 w-5 text-primary" />
                    <div>
                      <p className="font-medium">Lokasi</p>
                      <p className="text-sm text-muted-foreground">
                        {order.event.venue}, {order.event.address}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <Separator />

              <div>
                <h5 className="font-medium mb-3">Detail Tiket ({order.tickets.length} tiket)</h5>
                <div className="space-y-2">
                  {order.tickets.map((ticket, index) => (
                    <div key={ticket.id} className="flex items-center justify-between p-3 bg-muted rounded-lg">
                      <div className="flex items-center space-x-3">
                        <QrCode className="h-5 w-5 text-primary" />
                        <div>
                          <p className="font-medium">Tiket {index + 1}</p>
                          <p className="text-sm text-muted-foreground">{ticket.ticketType.name}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-mono text-xs bg-white px-2 py-1 rounded">
                          {ticket.qrCode.slice(-8)}
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">QR Code</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <Separator />

              <div className="flex justify-between items-center">
                <div>
                  <p className="text-sm text-muted-foreground">Total Pembayaran</p>
                  <p className="text-2xl font-bold text-primary">
                    Rp {order.totalAmount.toLocaleString('id-ID')}
                  </p>
                </div>
                <Badge variant="outline">{order.paymentMethod}</Badge>
              </div>
            </CardContent>
          </Card>

          {/* Action Buttons */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Button 
              variant="outline" 
              onClick={downloadTickets}
              disabled={downloading}
              className="flex items-center justify-center"
            >
              <Download className="h-4 w-4 mr-2" />
              {downloading ? 'Mengunduh...' : 'Unduh Tiket'}
            </Button>
            
            <Button 
              variant="outline" 
              onClick={sendEmailConfirmation}
              className="flex items-center justify-center"
            >
              <Mail className="h-4 w-4 mr-2" />
              Kirim Ulang Email
            </Button>
          </div>

          {/* Next Steps */}
          <Card>
            <CardHeader>
              <CardTitle>Langkah Selanjutnya</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-start space-x-3">
                  <div className="w-6 h-6 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-sm font-bold">1</div>
                  <div>
                    <p className="font-medium">Cek Email Anda</p>
                    <p className="text-sm text-muted-foreground">
                      Tiket elektronik telah dikirim ke {order.user.email}
                    </p>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <div className="w-6 h-6 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-sm font-bold">2</div>
                  <div>
                    <p className="font-medium">Simpan Tiket</p>
                    <p className="text-sm text-muted-foreground">
                      Unduh dan simpan tiket di smartphone Anda
                    </p>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <div className="w-6 h-6 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-sm font-bold">3</div>
                  <div>
                    <p className="font-medium">Tunjukkan QR Code</p>
                    <p className="text-sm text-muted-foreground">
                      Tunjukkan QR Code di pintu masuk event untuk validasi
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Navigation */}
          <div className="flex space-x-4">
            <Button asChild className="flex-1">
              <Link href="/my-tickets">Lihat Tiket Saya</Link>
            </Button>
            <Button variant="outline" asChild className="flex-1">
              <Link href="/">Jelajahi Event Lain</Link>
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
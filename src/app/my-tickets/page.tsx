'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Search, Calendar, MapPin, QrCode, Download, ExternalLink, User } from 'lucide-react'
import Link from 'next/link'

interface Ticket {
  id: string
  qrCode: string
  status: string
  createdAt: string
  scannedAt?: string
  event: {
    id: string
    title: string
    venue: string
    address: string
    startDate: string
    endDate: string
    imageUrl?: string
  }
  ticketType: {
    name: string
    price: number
  }
  order: {
    id: string
    totalAmount: number
    status: string
  }
}

export default function MyTickets() {
  const [tickets, setTickets] = useState<Ticket[]>([])
  const [filteredTickets, setFilteredTickets] = useState<Ticket[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(true)
  const [searching, setSearching] = useState(false)

  useEffect(() => {
    // Try to get email from localStorage or prompt user
    const storedEmail = localStorage.getItem('userEmail')
    if (storedEmail) {
      setEmail(storedEmail)
      fetchTickets(storedEmail)
    } else {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    const filtered = tickets.filter(ticket =>
      ticket.event.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      ticket.event.venue.toLowerCase().includes(searchTerm.toLowerCase()) ||
      ticket.ticketType.name.toLowerCase().includes(searchTerm.toLowerCase())
    )
    setFilteredTickets(filtered)
  }, [searchTerm, tickets])

  const fetchTickets = async (userEmail: string) => {
    try {
      const response = await fetch(`/api/users?email=${encodeURIComponent(userEmail)}`)
      if (!response.ok) {
        throw new Error('Failed to fetch user')
      }
      
      const userData = await response.json()
      setTickets(userData.tickets || [])
      setFilteredTickets(userData.tickets || [])
      localStorage.setItem('userEmail', userEmail)
    } catch (error) {
      console.error('Failed to fetch tickets:', error)
      alert('Gagal memuat tiket. Silakan coba lagi.')
    } finally {
      setLoading(false)
    }
  }

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    if (!email.trim()) {
      alert('Masukkan email Anda terlebih dahulu')
      return
    }
    
    setSearching(true)
    fetchTickets(email.trim())
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

  const getTicketStatusBadge = (status: string) => {
    const statusConfig = {
      ACTIVE: { label: 'Aktif', variant: 'default' as const },
      USED: { label: 'Digunakan', variant: 'secondary' as const },
      CANCELLED: { label: 'Dibatalkan', variant: 'destructive' as const },
      EXPIRED: { label: 'Kadaluarsa', variant: 'outline' as const }
    }
    
    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.ACTIVE
    return <Badge variant={config.variant}>{config.label}</Badge>
  }

  const downloadTicket = async (ticket: Ticket) => {
    try {
      const ticketText = `
Tiket Event - ${ticket.event.title}
================================

Order ID: ${ticket.order.id}
Ticket ID: ${ticket.id}
Status: ${ticket.status}

Informasi Event:
----------------
Judul: ${ticket.event.title}
Venue: ${ticket.event.venue}
Alamat: ${ticket.event.address}
Tanggal: ${formatDate(ticket.event.startDate)}

Informasi Tiket:
---------------
Tipe: ${ticket.ticketType.name}
Harga: Rp ${ticket.ticketType.price.toLocaleString('id-ID')}
QR Code: ${ticket.qrCode}
Status: ${ticket.status}

${ticket.scannedAt ? `Waktu Scan: ${formatDate(ticket.scannedAt)}` : ''}

================================
Simpan tiket ini sebagai bukti pembelian yang sah.
Tunjukkan QR Code di pintu masuk event.
      `.trim()

      const blob = new Blob([ticketText], { type: 'text/plain' })
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `tiket-${ticket.id}.txt`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
    } catch (error) {
      console.error('Failed to download ticket:', error)
      alert('Gagal mengunduh tiket. Silakan coba lagi.')
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-8">
          <div className="flex items-center justify-center min-h-96">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
              <p className="text-muted-foreground">Memuat tiket...</p>
            </div>
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
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <h1 className="text-2xl font-bold">Tiket Saya</h1>
              <Badge variant="outline">{filteredTickets.length} tiket</Badge>
            </div>
            <nav className="flex items-center space-x-4">
              <Button variant="ghost" asChild>
                <Link href="/">Beranda</Link>
              </Button>
            </nav>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        {/* Email Search Form */}
        {!email && (
          <Card className="mb-8">
            <CardHeader>
              <CardTitle className="flex items-center">
                <User className="h-5 w-5 mr-2" />
                Masukkan Email Anda
              </CardTitle>
              <CardDescription>
                Masukkan email yang Anda gunakan saat pembelian untuk melihat tiket Anda
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSearch} className="flex space-x-4">
                <div className="flex-1">
                  <Input
                    type="email"
                    placeholder="email@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>
                <Button type="submit" disabled={searching}>
                  {searching ? 'Mencari...' : 'Cari Tiket'}
                </Button>
              </form>
            </CardContent>
          </Card>
        )}

        {/* Search Bar */}
        {email && (
          <div className="mb-8">
            <div className="relative max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                type="text"
                placeholder="Cari event, venue, atau tipe tiket..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="mt-4 flex items-center justify-between">
              <p className="text-sm text-muted-foreground">
                Menampilkan tiket untuk: <span className="font-medium">{email}</span>
              </p>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => {
                  localStorage.removeItem('userEmail')
                  setEmail('')
                  setTickets([])
                  setFilteredTickets([])
                }}
              >
                Ganti Email
              </Button>
            </div>
          </div>
        )}

        {/* Tickets List */}
        {filteredTickets.length === 0 ? (
          <div className="text-center py-12">
            <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
              <QrCode className="h-8 w-8 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-semibold mb-2">
              {email ? 'Tidak ada tiket ditemukan' : 'Belum ada tiket'}
            </h3>
            <p className="text-muted-foreground mb-4">
              {email 
                ? 'Anda belum memiliki tiket untuk event yang dicari' 
                : 'Beli tiket event dan lihat di sini'
              }
            </p>
            <Button asChild>
              <Link href="/">Jelajahi Event</Link>
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredTickets.map((ticket) => (
              <Card key={ticket.id} className="overflow-hidden hover:shadow-lg transition-shadow">
                {ticket.event.imageUrl && (
                  <div className="aspect-video w-full overflow-hidden">
                    <img
                      src={ticket.event.imageUrl}
                      alt={ticket.event.title}
                      className="w-full h-full object-cover"
                    />
                  </div>
                )}
                
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="line-clamp-2">{ticket.event.title}</CardTitle>
                      <CardDescription className="mt-1">
                        {ticket.ticketType.name}
                      </CardDescription>
                    </div>
                    {getTicketStatusBadge(ticket.status)}
                  </div>
                </CardHeader>

                <CardContent className="space-y-3">
                  <div className="flex items-center text-sm text-muted-foreground">
                    <Calendar className="h-4 w-4 mr-2" />
                    {formatDate(ticket.event.startDate)}
                  </div>
                  
                  <div className="flex items-center text-sm text-muted-foreground">
                    <MapPin className="h-4 w-4 mr-2" />
                    {ticket.event.venue}
                  </div>
                  
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">QR Code:</span>
                    <span className="font-mono text-xs bg-muted px-2 py-1 rounded">
                      {ticket.qrCode.slice(-8)}
                    </span>
                  </div>

                  {ticket.scannedAt && (
                    <div className="text-sm text-green-600">
                      <p>✓ Sudah digunakan</p>
                      <p className="text-xs">{formatDate(ticket.scannedAt)}</p>
                    </div>
                  )}

                  <Separator />

                  <div className="flex space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => downloadTicket(ticket)}
                      className="flex-1"
                    >
                      <Download className="h-4 w-4 mr-1" />
                      Unduh
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      asChild
                      className="flex-1"
                    >
                      <Link href={`/event/${ticket.event.id}`}>
                        <ExternalLink className="h-4 w-4 mr-1" />
                        Lihat Event
                      </Link>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
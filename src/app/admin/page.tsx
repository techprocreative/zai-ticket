'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Calendar,
  MapPin,
  Users,
  Ticket,
  TrendingUp,
  DollarSign,
  AlertCircle,
  CheckCircle,
  Clock,
  Eye,
  Edit,
  Trash2,
  Plus,
  Image as ImageIcon
} from 'lucide-react'
import Link from 'next/link'
import { ThemeToggle } from '@/components/theme-toggle'
import { SlideFormDialog, type SlideFormValues } from '@/components/slide-form-dialog'
import type { HeroSlide } from '@/types/hero-slide'

interface Event {
  id: string
  title: string
  description: string
  venue: string
  address: string
  startDate: string
  endDate: string
  maxCapacity: number
  currentCapacity: number
  status: string
  imageUrl?: string
  ticketTypes: {
    id: string
    name: string
    price: number
    soldQuantity: number
    maxQuantity: number
  }[]
  _count: {
    tickets: number
    orders: number
  }
}

interface DashboardStats {
  totalEvents: number
  totalTickets: number
  totalRevenue: number
  activeEvents: number
}

export default function Admin() {
  const [events, setEvents] = useState<Event[]>([])
  const [stats, setStats] = useState<DashboardStats>({
    totalEvents: 0,
    totalTickets: 0,
    totalRevenue: 0,
    activeEvents: 0
  })
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [slides, setSlides] = useState<HeroSlide[]>([])
  const [slideModalOpen, setSlideModalOpen] = useState(false)
  const [editingSlide, setEditingSlide] = useState<HeroSlide | null>(null)

  useEffect(() => {
    fetchDashboardData()
  }, [])

  useEffect(() => {
    const filtered = events.filter(event =>
      event.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      event.venue.toLowerCase().includes(searchTerm.toLowerCase())
    )
    // Update filtered events display
  }, [searchTerm, events])

  const fetchDashboardData = async () => {
    try {
      const [eventsResponse, ordersResponse, slidesResponse] = await Promise.all([
        fetch('/api/events'),
        fetch('/api/orders'),
        fetch('/api/slides?all=true')
      ])

      const eventsData = await eventsResponse.json()
      const ordersData = await ordersResponse.json()
      const slidesData = await slidesResponse.json()

      setEvents(eventsData)
      setSlides(slidesData)

      // Calculate stats
      const totalRevenue = ordersData
        .filter((order: any) => order.status === 'PAID')
        .reduce((sum: number, order: any) => sum + order.totalAmount, 0)

      const totalTickets = eventsData.reduce((sum: number, event: Event) => 
        sum + event._count.tickets, 0)

      const activeEvents = eventsData.filter((event: Event) => 
        event.status === 'UPCOMING' || event.status === 'ONGOING').length

      setStats({
        totalEvents: eventsData.length,
        totalTickets,
        totalRevenue,
        activeEvents
      })
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSlideSubmit = async (values: SlideFormValues) => {
    const user = localStorage.getItem('user')
    const headers: HeadersInit = {
      'Content-Type': 'application/json'
    }
    if (user) headers['x-user'] = user

    const method = editingSlide ? 'PUT' : 'POST'
    const payload = editingSlide ? { id: editingSlide.id, ...values } : values

    const response = await fetch('/api/slides', {
      method,
      headers,
      body: JSON.stringify(payload)
    })

    if (response.ok) {
      await fetchDashboardData()
      setEditingSlide(null)
    } else {
      alert('Gagal menyimpan slide')
    }
  }

  const handleSlideDelete = async (id: string) => {
    if (!confirm('Hapus slide ini?')) return
    const user = localStorage.getItem('user')
    const headers: HeadersInit = {}
    if (user) headers['x-user'] = user

    const response = await fetch(`/api/slides?id=${id}`, {
      method: 'DELETE',
      headers
    })

    if (response.ok) {
      await fetchDashboardData()
    } else {
      alert('Gagal menghapus slide')
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

  const getEventStatusBadge = (status: string) => {
    const statusConfig = {
      UPCOMING: { label: 'Akan Datang', variant: 'secondary' as const },
      ONGOING: { label: 'Berlangsung', variant: 'default' as const },
      COMPLETED: { label: 'Selesai', variant: 'outline' as const },
      CANCELLED: { label: 'Dibatalkan', variant: 'destructive' as const }
    }
    
    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.UPCOMING
    return <Badge variant={config.variant}>{config.label}</Badge>
  }

  const getOccupancyRate = (current: number, max: number) => {
    if (max === 0) return 0
    return Math.round((current / max) * 100)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-8">
          <div className="flex items-center justify-center min-h-96">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
              <p className="text-muted-foreground">Memuat dashboard...</p>
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
              <h1 className="text-2xl font-bold">Admin Dashboard</h1>
              <Badge variant="outline">TiketKu Management</Badge>
            </div>
            <nav className="flex items-center space-x-4">
              <ThemeToggle />
              <Button variant="ghost" asChild>
                <Link href="/gate">Gate Entry</Link>
              </Button>
              <Button variant="ghost" asChild>
                <Link href="/">Beranda</Link>
              </Button>
            </nav>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Events</CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalEvents}</div>
              <p className="text-xs text-muted-foreground">
                {stats.activeEvents} event aktif
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Tiket Terjual</CardTitle>
              <Ticket className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalTickets}</div>
              <p className="text-xs text-muted-foreground">
                Semua event
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                Rp {stats.totalRevenue.toLocaleString('id-ID')}
              </div>
              <p className="text-xs text-muted-foreground">
                Pembayaran lunas
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Event Aktif</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.activeEvents}</div>
              <p className="text-xs text-muted-foreground">
                Sedang berlangsung
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <Tabs defaultValue="events" className="space-y-6">
          <TabsList>
            <TabsTrigger value="events">Event Management</TabsTrigger>
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
            <TabsTrigger value="settings">Settings</TabsTrigger>
            <TabsTrigger value="slides">Hero Slider</TabsTrigger>
          </TabsList>

          <TabsContent value="events" className="space-y-6">
            {/* Events List */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Event Management</CardTitle>
                    <CardDescription>
                      Kelola semua event dan monitoring penjualan tiket
                    </CardDescription>
                  </div>
                  <Button>
                    <Plus className="h-4 w-4 mr-2" />
                    Tambah Event
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {/* Search */}
                <div className="mb-6">
                  <Input
                    type="text"
                    placeholder="Cari event berdasarkan nama atau venue..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="max-w-md"
                  />
                </div>

                {/* Events Grid */}
                <div className="space-y-4">
                  {events.map((event) => (
                    <div key={event.id} className="border rounded-lg p-6">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center space-x-3 mb-2">
                            <h3 className="text-lg font-semibold">{event.title}</h3>
                            {getEventStatusBadge(event.status)}
                          </div>
                          
                          <p className="text-muted-foreground mb-4 line-clamp-2">
                            {event.description}
                          </p>

                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                            <div className="flex items-center space-x-2">
                              <Calendar className="h-4 w-4 text-muted-foreground" />
                              <span className="text-sm">{formatDate(event.startDate)}</span>
                            </div>
                            <div className="flex items-center space-x-2">
                              <MapPin className="h-4 w-4 text-muted-foreground" />
                              <span className="text-sm">{event.venue}</span>
                            </div>
                            <div className="flex items-center space-x-2">
                              <Users className="h-4 w-4 text-muted-foreground" />
                              <span className="text-sm">
                                {event.currentCapacity}/{event.maxCapacity} 
                                ({getOccupancyRate(event.currentCapacity, event.maxCapacity)}%)
                              </span>
                            </div>
                          </div>

                          {/* Ticket Types */}
                          <div className="space-y-2">
                            <p className="text-sm font-medium">Tipe Tiket:</p>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                              {event.ticketTypes.map((ticketType) => (
                                <div key={ticketType.id} className="bg-muted p-3 rounded">
                                  <div className="flex justify-between items-center">
                                    <span className="text-sm font-medium">{ticketType.name}</span>
                                    <Badge variant="outline">
                                      {ticketType.soldQuantity}/{ticketType.maxQuantity}
                                    </Badge>
                                  </div>
                                  <p className="text-sm text-muted-foreground">
                                    Rp {ticketType.price.toLocaleString('id-ID')}
                                  </p>
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>

                        {/* Actions */}
                        <div className="flex space-x-2 ml-4">
                          <Button variant="outline" size="sm">
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button variant="outline" size="sm">
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button variant="outline" size="sm">
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>

                      {/* Progress Bar */}
                      <div className="mt-4">
                        <div className="w-full bg-muted rounded-full h-2">
                          <div 
                            className="bg-primary h-2 rounded-full transition-all duration-300"
                            style={{ 
                              width: `${getOccupancyRate(event.currentCapacity, event.maxCapacity)}%` 
                            }}
                          ></div>
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">
                          {getOccupancyRate(event.currentCapacity, event.maxCapacity)}% kapasitas terisi
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="analytics" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Analytics Dashboard</CardTitle>
                <CardDescription>
                  Analisis penjualan dan performa event
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-12">
                  <TrendingUp className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                  <h3 className="text-lg font-semibold mb-2">Analytics Coming Soon</h3>
                  <p className="text-muted-foreground">
                    Fitur analisis detail akan segera tersedia
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="settings" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Settings</CardTitle>
                <CardDescription>
                  Konfigurasi sistem dan pengaturan admin
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-12">
                  <AlertCircle className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                  <h3 className="text-lg font-semibold mb-2">Settings Coming Soon</h3>
                  <p className="text-muted-foreground">
                    Pengaturan sistem akan segera tersedia
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="slides" className="space-y-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>Hero Slider</CardTitle>
                  <CardDescription>
                    Kelola slide yang tampil di landing page
                  </CardDescription>
                </div>
                <Button onClick={() => {
                  setEditingSlide(null)
                  setSlideModalOpen(true)
                }}>
                  <Plus className="h-4 w-4 mr-2" />
                  Tambah Slide
                </Button>
              </CardHeader>
              <CardContent>
                {slides.length === 0 ? (
                  <p className="text-muted-foreground text-sm">Belum ada slide</p>
                ) : (
                  <div className="space-y-4">
                    {slides.map((slide) => (
                      <div key={slide.id} className="border rounded-lg p-4 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                        <div className="flex items-start gap-4">
                          <div className="relative h-24 w-40 overflow-hidden rounded-lg bg-muted">
                            <img src={slide.imageUrl} alt={slide.title} className="h-full w-full object-cover" />
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <h4 className="font-semibold">{slide.title}</h4>
                              <Badge variant={slide.isActive ? 'default' : 'secondary'}>
                                {slide.isActive ? 'Aktif' : 'Non-aktif'}
                              </Badge>
                            </div>
                            {slide.subtitle && (
                              <p className="text-sm text-muted-foreground line-clamp-2">{slide.subtitle}</p>
                            )}
                            <p className="text-xs text-muted-foreground mt-1">Urutan: {slide.sortOrder}</p>
                            {slide.ctaLink && (
                              <a href={slide.ctaLink} className="text-xs text-primary" target="_blank" rel="noreferrer">
                                {slide.ctaLabel || slide.ctaLink}
                              </a>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button variant="outline" size="sm" onClick={() => {
                            setEditingSlide(slide)
                            setSlideModalOpen(true)
                          }}>
                            <Edit className="h-4 w-4 mr-2" /> Edit
                          </Button>
                          <Button variant="destructive" size="sm" onClick={() => handleSlideDelete(slide.id)}>
                            <Trash2 className="h-4 w-4 mr-2" /> Hapus
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      <SlideFormDialog
        open={slideModalOpen}
        onOpenChange={setSlideModalOpen}
        initialData={editingSlide}
        onSubmit={handleSlideSubmit}
      />
    </div>
  )
}
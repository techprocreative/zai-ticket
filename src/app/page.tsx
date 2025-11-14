'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Search, Calendar, MapPin, Users, Clock } from 'lucide-react'
import Link from 'next/link'
import { ThemeToggle } from '@/components/theme-toggle'
import { HeroSlider } from '@/components/hero-slider'
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
}

export default function Home() {
  const [events, setEvents] = useState<Event[]>([])
  const [filteredEvents, setFilteredEvents] = useState<Event[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [loading, setLoading] = useState(true)
  const [slides, setSlides] = useState<HeroSlide[]>([])
  const [sliderLoading, setSliderLoading] = useState(true)

  useEffect(() => {
    fetchEvents()
    fetchSlides()
  }, [])

  useEffect(() => {
    const filtered = events.filter(event =>
      event.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      event.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      event.venue.toLowerCase().includes(searchTerm.toLowerCase()) ||
      event.address.toLowerCase().includes(searchTerm.toLowerCase())
    )
    setFilteredEvents(filtered)
  }, [searchTerm, events])

  const fetchEvents = async () => {
    try {
      const response = await fetch('/api/events')
      const data = await response.json()
      setEvents(data)
      setFilteredEvents(data)
    } catch (error) {
      console.error('Failed to fetch events:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchSlides = async () => {
    try {
      const response = await fetch('/api/slides')
      if (response.ok) {
        const data = await response.json()
        setSlides(data)
      }
    } catch (error) {
      console.error('Failed to fetch slides:', error)
    } finally {
      setSliderLoading(false)
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
      ONGOING: { label: 'Sedang Berlangsung', variant: 'default' as const },
      COMPLETED: { label: 'Selesai', variant: 'outline' as const },
      CANCELLED: { label: 'Dibatalkan', variant: 'destructive' as const }
    }
    
    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.UPCOMING
    return <Badge variant={config.variant}>{config.label}</Badge>
  }

  const getLowestPrice = (ticketTypes: Event['ticketTypes']) => {
    if (ticketTypes.length === 0) return 0
    return Math.min(...ticketTypes.map(type => type.price))
  }

  const getAvailableTickets = (ticketTypes: Event['ticketTypes']) => {
    return ticketTypes.reduce((total, type) => total + (type.maxQuantity - type.soldQuantity), 0)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-8">
          <div className="flex items-center justify-center min-h-96">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
              <p className="text-muted-foreground">Memuat events...</p>
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
              <h1 className="text-2xl font-bold text-foreground">TiketKu</h1>
              <Badge variant="outline">Online Ticketing System</Badge>
            </div>
            <nav className="flex items-center space-x-4">
              <ThemeToggle />
              <Button variant="ghost" asChild>
                <Link href="/my-tickets">Tiket Saya</Link>
              </Button>
              <Button asChild>
                <Link href="/login">Masuk</Link>
              </Button>
            </nav>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="bg-gradient-to-r from-primary/10 to-primary/5 py-16">
        <div className="container mx-auto px-4">
          <div className="mb-10 text-center">
            <h2 className="text-4xl font-bold mb-4">Temukan Event Terbaik</h2>
            <p className="text-xl text-muted-foreground">
              Beli tiket online dengan mudah dan aman untuk berbagai acara
            </p>
          </div>

          {!sliderLoading && slides.length > 0 && (
            <div className="mb-12">
              <HeroSlider slides={slides} />
            </div>
          )}

          {/* Search Bar */}
          <div className="max-w-2xl mx-auto relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input
              type="text"
              placeholder="Cari event, venue, atau lokasi..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 h-12 text-lg"
            />
          </div>
        </div>
      </section>

      {/* Events Section */}
      <section className="py-12">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between mb-8">
            <h3 className="text-2xl font-bold">Event Tersedia</h3>
            <p className="text-muted-foreground">
              {filteredEvents.length} event ditemukan
            </p>
          </div>

          {filteredEvents.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground text-lg">
                {searchTerm ? 'Tidak ada event yang ditemukan' : 'Belum ada event tersedia'}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredEvents.map((event) => (
                <Card key={event.id} className="overflow-hidden hover:shadow-lg transition-shadow">
                  {event.imageUrl && (
                    <div className="aspect-video w-full overflow-hidden">
                      <img
                        src={event.imageUrl}
                        alt={event.title}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  )}
                  
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <CardTitle className="line-clamp-2">{event.title}</CardTitle>
                        <CardDescription className="mt-2 line-clamp-2">
                          {event.description}
                        </CardDescription>
                      </div>
                      {getEventStatusBadge(event.status)}
                    </div>
                  </CardHeader>

                  <CardContent className="space-y-3">
                    <div className="flex items-center text-sm text-muted-foreground">
                      <Calendar className="h-4 w-4 mr-2" />
                      {formatDate(event.startDate)}
                    </div>
                    
                    <div className="flex items-center text-sm text-muted-foreground">
                      <MapPin className="h-4 w-4 mr-2" />
                      {event.venue}, {event.address}
                    </div>
                    
                    <div className="flex items-center justify-between text-sm">
                      <div className="flex items-center text-muted-foreground">
                        <Users className="h-4 w-4 mr-2" />
                        {getAvailableTickets(event.ticketTypes)} tiket tersisa
                      </div>
                      <div className="flex items-center text-muted-foreground">
                        <Clock className="h-4 w-4 mr-2" />
                        {event.currentCapacity}/{event.maxCapacity}
                      </div>
                    </div>

                    <div className="pt-2 border-t">
                      <p className="text-lg font-bold text-primary">
                        Mulai dari Rp {getLowestPrice(event.ticketTypes).toLocaleString('id-ID')}
                      </p>
                    </div>
                  </CardContent>

                  <CardFooter>
                    <Button asChild className="w-full">
                      <Link href={`/event/${event.id}`}>
                        Beli Tiket
                      </Link>
                    </Button>
                  </CardFooter>
                </Card>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-card border-t py-8 mt-16">
        <div className="container mx-auto px-4 text-center">
          <p className="text-muted-foreground">
            © 2024 TiketKu - Platform Online Ticketing System
          </p>
        </div>
      </footer>
    </div>
  )
}
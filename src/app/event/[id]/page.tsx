'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Calendar, MapPin, Users, Clock, ArrowLeft, ShoppingCart, TrendingDown, TrendingUp, AlertCircle } from 'lucide-react'
import Link from 'next/link'
import { useRealtime } from '@/components/realtime-provider'

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
    description?: string
    price: number
    soldQuantity: number
    maxQuantity: number
    isValid: boolean
  }[]
}

interface TicketAvailability {
  ticketTypeId: string
  available: number
  total: number
  sold: number
  eventId: string
  eventTitle: string
}

export default function EventDetail() {
  const params = useParams()
  const router = useRouter()
  const [event, setEvent] = useState<Event | null>(null)
  const [loading, setLoading] = useState(true)
  const [quantities, setQuantities] = useState<{ [key: string]: number }>({})
  const [realtimeQuantities, setRealtimeQuantities] = useState<{ [key: string]: number }>({})
  const { socket, isConnected, subscribeToEvent, checkAvailability } = useRealtime()
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (params.id) {
      fetchEvent(params.id as string)
    }
  }, [params.id])

  useEffect(() => {
    if (event && isConnected) {
      // Subscribe to real-time updates for this event
      subscribeToEvent(event.id)
      
      // Check availability for all ticket types
      event.ticketTypes.forEach(ticketType => {
        checkAvailability(ticketType.id)
      })
    }
  }, [event, isConnected, subscribeToEvent, checkAvailability])

  useEffect(() => {
    if (socket) {
      // Listen for real-time availability updates
      socket.on('availability-update', (data: TicketAvailability) => {
        console.log('Real-time availability update:', data)
        setRealtimeQuantities(prev => ({
          ...prev,
          [data.ticketTypeId]: data.available
        }))
      })

      return () => {
        socket.off('availability-update')
      }
    }
  }, [socket])

  const fetchEvent = async (eventId: string) => {
    try {
      const response = await fetch(`/api/events/${eventId}`)
      if (!response.ok) {
        throw new Error('Event not found')
      }
      const data = await response.json()
      setEvent(data)
      
      // Initialize quantities
      const initialQuantities: { [key: string]: number } = {}
      data.ticketTypes.forEach((type: any) => {
        initialQuantities[type.id] = 0
      })
      setQuantities(initialQuantities)
    } catch (error) {
      console.error('Failed to fetch event:', error)
      router.push('/')
    } finally {
      setLoading(false)
    }
  }

  const updateQuantity = (ticketTypeId: string, delta: number) => {
    const ticketType = event?.ticketTypes.find(t => t.id === ticketTypeId)
    if (!ticketType) return

    const current = quantities[ticketTypeId] || 0
    const realtime = realtimeQuantities[ticketTypeId] || ticketType.maxQuantity - ticketType.soldQuantity
    const available = Math.min(realtime, ticketType.maxQuantity - ticketType.soldQuantity)
    const newQuantity = Math.max(0, Math.min(current + delta, available))
    
    setQuantities(prev => ({
      ...prev,
      [ticketTypeId]: newQuantity
    }))
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

  const getOccupancyRate = (current: number, max: number) => {
    if (max === 0) return 0
    return Math.round((current / max) * 100)
  }

  const getLowestPrice = (ticketTypes: Event['ticketTypes']) => {
    if (ticketTypes.length === 0) return 0
    return Math.min(...ticketTypes.map(type => type.price))
  }

  const getAvailableTickets = (ticketTypes: Event['ticketTypes']) => {
    return ticketTypes.reduce((sum, type) => sum + (type.maxQuantity - type.soldQuantity), 0)
  }

  const handleCheckout = () => {
    const items = Object.entries(quantities)
      .filter(([_, qty]) => qty > 0)
      .map(([ticketTypeId, qty]) => ({
        ticketTypeId,
        quantity: qty,
        ticketType: event?.ticketTypes.find(t => t.id === ticketTypeId)
      }))

    if (items.length === 0) return

    // Store order data in sessionStorage for checkout
    sessionStorage.setItem('orderData', JSON.stringify({
      eventId: event?.id,
      eventTitle: event?.title,
      items,
      totalAmount: items.reduce((sum, [_, qty]) => {
        const ticketType = event?.ticketTypes.find(t => t.id === _)
        return sum + (ticketType?.price || 0) * qty
      }, 0)
    }))

    router.push('/checkout')
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-8">
          <div className="flex items-center justify-center min-h-96">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
              <p className="text-muted-foreground">Memuat detail event...</p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (!event) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-8">
          <div className="text-center">
            <p className="text-muted-foreground">Event tidak ditemukan</p>
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
      {/* Connection Status */}
      {isConnected && (
        <div className="bg-green-50 border border-green-200 text-green-800 px-4 py-2 text-sm">
          <div className="flex items-center">
            <div className="w-2 h-2 bg-green-500 rounded-full mr-2 animate-pulse"></div>
            Real-time updates aktif
          </div>
        </div>
      )}

      {/* Header */}
      <header className="bg-card border-b sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Button variant="ghost" size="sm" asChild>
                <Link href="/">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Kembali
                </Link>
              </Button>
              <h1 className="text-xl font-bold">{event.title}</h1>
            </div>
            <div className="flex items-center space-x-4">
              {getEventStatusBadge(event.status)}
              {isConnected && (
                <Badge variant="outline" className="text-green-600 border-green-600">
                  <div className="flex items-center">
                    <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
                    Live
                  </div>
                </Badge>
              )}
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Event Details */}
          <div className="lg:col-span-2 space-y-6">
            {/* Event Image */}
            {event.imageUrl && (
              <div className="aspect-video w-full overflow-hidden rounded-lg">
                <img
                  src={event.imageUrl}
                  alt={event.title}
                  className="w-full h-full object-cover"
                />
              </div>
            )}

            {/* Event Info */}
            <Card>
              <CardHeader>
                <CardTitle className="text-2xl">{event.title}</CardTitle>
                <CardDescription className="text-base">
                  {event.description}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex items-center space-x-3">
                    <Calendar className="h-5 w-5 text-primary" />
                    <div>
                      <p className="font-medium">Tanggal & Waktu</p>
                      <p className="text-sm text-muted-foreground">
                        {formatDate(event.startDate)}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-3">
                    <MapPin className="h-5 w-5 text-primary" />
                    <div>
                      <p className="font-medium">Lokasi</p>
                      <p className="text-sm text-muted-foreground">
                        {event.venue}, {event.address}
                      </p>
                    </div>
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex items-center space-x-3">
                    <Users className="h-5 w-5 text-primary" />
                    <div>
                      <p className="font-medium">Kapasitas</p>
                      <p className="text-sm text-muted-foreground">
                        {event.currentCapacity} / {event.maxCapacity} ({getOccupancyRate(event.currentCapacity, event.maxCapacity)}%)
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-3">
                    <Clock className="h-5 w-5 text-primary" />
                    <div>
                      <p className="font-medium">Durasi</p>
                      <p className="text-sm text-muted-foreground">
                        {formatDate(event.startDate)} - {formatDate(event.endDate)}
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Ticket Types */}
            <Card>
              <CardHeader>
                <CardTitle>Tipe Tiket Tersedia</CardTitle>
                <CardDescription>
                  <div className="flex items-center space-x-2">
                    <ShoppingCart className="h-4 w-4" />
                    Pilih tiket sesuai dengan kebutuhan Anda
                  </div>
                  {isConnected && (
                    <Badge variant="outline" className="text-green-600 border-green-600">
                      <div className="flex items-center">
                        <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
                        Real-time Stock
                      </div>
                    </Badge>
                  )}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {event.ticketTypes.map((ticketType) => {
                  const available = ticketType.maxQuantity - ticketType.soldQuantity
                  const realtimeAvailable = realtimeQuantities[ticketType.id] || available
                  const quantity = quantities[ticketType.id] || 0
                  const isLowStock = realtimeAvailable <= 5
                  
                  return (
                    <div key={ticketType.id} className="border rounded-lg p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h4 className="font-semibold">{ticketType.name}</h4>
                          {ticketType.description && (
                            <p className="text-sm text-muted-foreground mt-1">
                              {ticketType.description}
                            </p>
                          )}
                          <div className="mt-2">
                            <p className="text-lg font-bold text-primary">
                              Rp {ticketType.price.toLocaleString('id-ID')}
                            </p>
                            <div className="flex items-center space-x-2 mt-1">
                              <p className="text-sm text-muted-foreground">
                                Tersisa: {realtimeAvailable} dari {ticketType.maxQuantity}
                              </p>
                              {isLowStock && (
                                <Badge variant="destructive" className="text-xs">
                                  <AlertCircle className="h-3 w-3 mr-1" />
                                  Terbatas
                                </Badge>
                              )}
                              {isConnected && realtimeAvailable < available && (
                                <Badge variant="secondary" className="text-xs">
                                  <TrendingDown className="h-3 w-3 mr-1" />
                                  Stock Turun
                                </Badge>
                              )}
                              {isConnected && realtimeAvailable > available && (
                                <Badge variant="default" className="text-xs">
                                  <TrendingUp className="h-3 w-3 mr-1" />
                                  Stock Naik
                                </Badge>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                      
                      {available > 0 ? (
                        <div className="flex items-center space-x-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => updateQuantity(ticketType.id, -1)}
                            disabled={quantity === 0}
                          >
                            -
                          </Button>
                          <span className="w-8 text-center">{quantity}</span>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => updateQuantity(ticketType.id, 1)}
                            disabled={quantity >= realtimeAvailable}
                          >
                            +
                          </Button>
                        </div>
                      ) : (
                        <Badge variant="destructive">Habis</Badge>
                      )}
                    </div>
                  )
                })}
              </CardContent>
            </Card>
          </div>

          {/* Order Summary */}
          <div className="lg:col-span-1">
            <Card className="sticky top-24">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <ShoppingCart className="h-5 w-5 mr-2" />
                  Ringkasan Pesanan
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {Object.entries(quantities).filter(([_, qty]) => qty > 0).length === 0 ? (
                  <p className="text-muted-foreground text-center py-4">
                    Belum ada tiket yang dipilih
                  </p>
                ) : (
                  <>
                    <div className="space-y-2">
                      {event.ticketTypes.map((ticketType) => {
                        const quantity = quantities[ticketType.id] || 0
                        if (quantity === 0) return null
                        
                        return (
                          <div key={ticketType.id} className="flex justify-between text-sm">
                            <span>{ticketType.name} x {quantity}</span>
                            <span>Rp {(ticketType.price * quantity).toLocaleString('id-ID')}</span>
                          </div>
                        )
                      })}
                    </div>
                    
                    <Separator />
                    
                    <div className="flex justify-between font-bold">
                      <span>Total</span>
                      <span className="text-primary">
                        Rp {event.ticketTypes.reduce((sum, ticketType) => {
                          const quantity = quantities[ticketType.id] || 0
                          return sum + (ticketType.price * quantity)
                        }, 0).toLocaleString('id-ID')}
                      </span>
                    </div>
                  </>
                )}
                
                <Button 
                  className="w-full" 
                  onClick={handleCheckout}
                  disabled={Object.entries(quantities).filter(([_, qty]) => qty > 0).length === 0}
                >
                  Lanjut ke Pembayaran
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
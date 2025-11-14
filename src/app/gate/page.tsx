'use client'

import { useState, useEffect, useRef } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { QrCode, Camera, CheckCircle, XCircle, Clock, Users, MapPin, Calendar, AlertTriangle } from 'lucide-react'
import Link from 'next/link'
import { ThemeToggle } from '@/components/theme-toggle'

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
  }
  ticketType: {
    name: string
    price: number
  }
  user: {
    name: string
    email: string
  }
  gateScans: {
    id: string
    gateEntry: {
      name: string
      location: string
    }
    scanTime: string
    isValid: boolean
    notes?: string
  }[]
}

export default function GateEntry() {
  const [qrCode, setQrCode] = useState('')
  const [loading, setLoading] = useState(false)
  const [ticket, setTicket] = useState<Ticket | null>(null)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [gateEntries, setGateEntries] = useState<any[]>([])
  const [selectedGate, setSelectedGate] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    fetchGateEntries()
    // Auto focus on input
    if (inputRef.current) {
      inputRef.current.focus()
    }
  }, [])

  const fetchGateEntries = async () => {
    try {
      const response = await fetch('/api/gate-entries')
      if (response.ok) {
        const data = await response.json()
        setGateEntries(data)
        if (data.length > 0) {
          setSelectedGate(data[0].id)
        }
      }
    } catch (error) {
      console.error('Failed to fetch gate entries:', error)
    }
  }

  const handleScan = async (scannedCode: string) => {
    if (!scannedCode.trim()) return
    if (!selectedGate) {
      setError('Pilih gate entry terlebih dahulu')
      return
    }

    setLoading(true)
    setError('')
    setSuccess('')
    setTicket(null)

    try {
      const response = await fetch('/api/tickets/validate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          qrCode: scannedCode.trim(),
          gateEntryId: selectedGate
        })
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Validation failed')
      }

      setTicket(data.ticket)
      setSuccess(data.message)
      setQrCode('')
      
      // Auto focus back to input
      if (inputRef.current) {
        inputRef.current.focus()
      }
    } catch (error: any) {
      setError(error.message || 'Gagal memvalidasi tiket')
      setTicket(null)
    } finally {
      setLoading(false)
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleScan(qrCode)
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

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-card border-b sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <h1 className="text-2xl font-bold">Gate Entry System</h1>
              <Badge variant="outline">Ticket Validation</Badge>
            </div>
            <nav className="flex items-center space-x-4">
              <ThemeToggle />
              <Button variant="ghost" asChild>
                <Link href="/">Beranda</Link>
              </Button>
              <Button variant="ghost" asChild>
                <Link href="/admin">Admin</Link>
              </Button>
            </nav>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Scanner Section */}
          <div className="lg:col-span-2 space-y-6">
            {/* Gate Selection */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <MapPin className="h-5 w-5 mr-2" />
                  Pilih Gate Entry
                </CardTitle>
                <CardDescription>
                  Pilih lokasi gate untuk validasi tiket
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {gateEntries.map((gate) => (
                    <div
                      key={gate.id}
                      className={`border rounded-lg p-4 cursor-pointer transition-colors ${
                        selectedGate === gate.id
                          ? 'border-primary bg-primary/5'
                          : 'border-border hover:bg-accent'
                      } ${!gate.isActive ? 'opacity-50 cursor-not-allowed' : ''}`}
                      onClick={() => gate.isActive && setSelectedGate(gate.id)}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium">{gate.name}</p>
                          <p className="text-sm text-muted-foreground">{gate.location}</p>
                        </div>
                        <div className="flex items-center space-x-2">
                          {gate.isActive ? (
                            <Badge variant="outline">Aktif</Badge>
                          ) : (
                            <Badge variant="destructive">Non-aktif</Badge>
                          )}
                          {selectedGate === gate.id && (
                            <CheckCircle className="h-4 w-4 text-primary" />
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* QR Scanner */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <QrCode className="h-5 w-5 mr-2" />
                  Scan QR Code
                </CardTitle>
                <CardDescription>
                  Masukkan QR code tiket atau gunakan scanner
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex space-x-4">
                  <div className="flex-1">
                    <Input
                      ref={inputRef}
                      type="text"
                      placeholder="Masukkan QR code tiket..."
                      value={qrCode}
                      onChange={(e) => setQrCode(e.target.value)}
                      onKeyPress={handleKeyPress}
                      disabled={loading || !selectedGate}
                    />
                  </div>
                  <Button
                    onClick={() => handleScan(qrCode)}
                    disabled={loading || !qrCode.trim() || !selectedGate}
                  >
                    {loading ? 'Memvalidasi...' : 'Validasi'}
                  </Button>
                </div>

                <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-8 text-center">
                  <Camera className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                  <p className="text-muted-foreground">
                    Scanner kamera akan segera tersedia
                  </p>
                  <p className="text-sm text-muted-foreground mt-2">
                    Saat ini, masukkan QR code secara manual
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Alert Messages */}
            {error && (
              <Alert variant="destructive">
                <XCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {success && (
              <Alert className="border-green-200 bg-green-50">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <AlertDescription className="text-green-800">{success}</AlertDescription>
              </Alert>
            )}

            {/* Ticket Details */}
            {ticket && (
              <Card className="border-green-200">
                <CardHeader>
                  <CardTitle className="flex items-center text-green-800">
                    <CheckCircle className="h-5 w-5 mr-2" />
                    Tiket Valid
                  </CardTitle>
                  <CardDescription>
                    Detail tiket berhasil divalidasi
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <h4 className="font-semibold text-green-800">{ticket.event.title}</h4>
                      <div className="space-y-2 mt-2">
                        <div className="flex items-center text-sm">
                          <Calendar className="h-4 w-4 mr-2 text-muted-foreground" />
                          {formatDate(ticket.event.startDate)}
                        </div>
                        <div className="flex items-center text-sm">
                          <MapPin className="h-4 w-4 mr-2 text-muted-foreground" />
                          {ticket.event.venue}
                        </div>
                        <div className="flex items-center text-sm">
                          <Users className="h-4 w-4 mr-2 text-muted-foreground" />
                          {ticket.ticketType.name}
                        </div>
                      </div>
                    </div>
                    
                    <div className="space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-muted-foreground">Status Tiket:</span>
                        {getTicketStatusBadge(ticket.status)}
                      </div>
                      
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-muted-foreground">Pemegang Tiket:</span>
                        <span className="text-sm font-medium">{ticket.user.name}</span>
                      </div>
                      
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-muted-foreground">Email:</span>
                        <span className="text-sm font-medium">{ticket.user.email}</span>
                      </div>

                      <div className="flex justify-between items-center">
                        <span className="text-sm text-muted-foreground">QR Code:</span>
                        <span className="text-xs font-mono bg-muted px-2 py-1 rounded">
                          {ticket.qrCode.slice(-8)}
                        </span>
                      </div>
                    </div>
                  </div>

                  {ticket.gateScans.length > 0 && (
                    <>
                      <Separator />
                      <div>
                        <h5 className="font-medium mb-2">Riwayat Scan:</h5>
                        <div className="space-y-2">
                          {ticket.gateScans.map((scan, index) => (
                            <div key={scan.id} className="flex items-center justify-between text-sm p-2 bg-muted rounded">
                              <div>
                                <p className="font-medium">{scan.gateEntry.name}</p>
                                <p className="text-xs text-muted-foreground">{scan.gateEntry.location}</p>
                              </div>
                              <div className="text-right">
                                <p className="text-xs">{formatDate(scan.scanTime)}</p>
                                {scan.isValid ? (
                                  <CheckCircle className="h-3 w-3 text-green-600 ml-auto" />
                                ) : (
                                  <XCircle className="h-3 w-3 text-red-600 ml-auto" />
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>
            )}
          </div>

          {/* Instructions & Stats */}
          <div className="lg:col-span-1 space-y-6">
            {/* Instructions */}
            <Card>
              <CardHeader>
                <CardTitle>Petunjuk Penggunaan</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-start space-x-3">
                  <div className="w-6 h-6 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-sm font-bold">1</div>
                  <div>
                    <p className="font-medium">Pilih Gate Entry</p>
                    <p className="text-sm text-muted-foreground">
                      Pilih lokasi gate tempat Anda berada
                    </p>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <div className="w-6 h-6 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-sm font-bold">2</div>
                  <div>
                    <p className="font-medium">Scan QR Code</p>
                    <p className="text-sm text-muted-foreground">
                      Arahkan scanner ke QR code tiket pengunjung
                    </p>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <div className="w-6 h-6 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-sm font-bold">3</div>
                  <div>
                    <p className="font-medium">Validasi Tiket</p>
                    <p className="text-sm text-muted-foreground">
                      Sistem akan otomatis memvalidasi dan mencatat scan
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Quick Stats */}
            <Card>
              <CardHeader>
                <CardTitle>Statistik Hari Ini</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center p-3 bg-muted rounded-lg">
                    <p className="text-2xl font-bold text-primary">0</p>
                    <p className="text-sm text-muted-foreground">Tiket Valid</p>
                  </div>
                  <div className="text-center p-3 bg-muted rounded-lg">
                    <p className="text-2xl font-bold text-destructive">0</p>
                    <p className="text-sm text-muted-foreground">Tiket Invalid</p>
                  </div>
                </div>
                
                <div className="text-center p-3 bg-muted rounded-lg">
                  <p className="text-2xl font-bold">0</p>
                  <p className="text-sm text-muted-foreground">Total Scan</p>
                </div>
              </CardContent>
            </Card>

            {/* Troubleshooting */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <AlertTriangle className="h-5 w-5 mr-2" />
                  Troubleshooting
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="p-3 bg-muted rounded-lg">
                  <p className="font-medium text-sm">QR Code tidak terbaca?</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Pastikan QR code tidak rusak dan cahaya cukup
                  </p>
                </div>
                <div className="p-3 bg-muted rounded-lg">
                  <p className="font-medium text-sm">Tiket sudah digunakan?</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Periksa riwayat scan untuk melihat penggunaan sebelumnya
                  </p>
                </div>
                <div className="p-3 bg-muted rounded-lg">
                  <p className="font-medium text-sm">Gate tidak aktif?</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Hubungi administrator untuk mengaktifkan gate
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
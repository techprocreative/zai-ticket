'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { 
  Users, 
  QrCode, 
  Clock, 
  TrendingUp, 
  AlertTriangle, 
  CheckCircle,
  Calendar,
  MapPin,
  Activity,
  LogOut,
  Plus,
  Edit,
  Trash2
} from 'lucide-react'
import Link from 'next/link'
import { ThemeToggle } from '@/components/theme-toggle'
import { SlideFormDialog, type SlideFormValues } from '@/components/slide-form-dialog'
import type { HeroSlide } from '@/types/hero-slide'

interface GateEntry {
  id: string
  name: string
  location: string
  isActive: boolean
  _count: {
    gateScans: number
  }
}

interface RecentScan {
  id: string
  ticketId: string
  gateEntryId: string
  scanTime: string
  isValid: boolean
  ticket: {
    event: {
      title: string
    }
    ticketType: {
      name: string
    }
    user: {
      name: string
      email: string
    }
  }
  gateEntry: {
    name: string
    location: string
  }
}

export default function StaffDashboard() {
  const [gateEntries, setGateEntries] = useState<GateEntry[]>([])
  const [recentScans, setRecentScans] = useState<RecentScan[]>([])
  const [stats, setStats] = useState({
    totalScans: 0,
    validScans: 0,
    invalidScans: 0,
    todayScans: 0
  })
  const [loading, setLoading] = useState(true)
  const [user, setUser] = useState<any>(null)
  const [slides, setSlides] = useState<HeroSlide[]>([])
  const [slideModalOpen, setSlideModalOpen] = useState(false)
  const [editingSlide, setEditingSlide] = useState<HeroSlide | null>(null)

  useEffect(() => {
    // Get user from localStorage
    const userData = localStorage.getItem('user')
    if (userData) {
      const parsedUser = JSON.parse(userData)
      setUser(parsedUser)
      
      // Check if user is staff
      if (parsedUser.role !== 'GATE_OPERATOR') {
        window.location.href = '/login'
        return
      }
    } else {
      window.location.href = '/login'
      return
    }

    fetchDashboardData()
  }, [])

  const fetchDashboardData = async () => {
    try {
      const [gateEntriesRes, scansRes, slidesRes] = await Promise.all([
        fetch('/api/gate-entries'),
        fetch('/api/scans/recent'),
        fetch('/api/slides?all=true')
      ])

      if (gateEntriesRes.ok) {
        const gatesData = await gateEntriesRes.json()
        setGateEntries(gatesData)
      }

      if (scansRes.ok) {
        const scansData = await scansRes.json()
        setRecentScans(scansData)
        
        // Calculate stats
        const totalScans = scansData.length
        const validScans = scansData.filter((scan: any) => scan.isValid).length
        const invalidScans = totalScans - validScans
        const todayScans = scansData.filter((scan: any) => {
          const scanDate = new Date(scan.scanTime)
          const today = new Date()
          return scanDate.toDateString() === today.toDateString()
        }).length

        setStats({
          totalScans,
          validScans,
          invalidScans,
          todayScans
        })
      }

      if (slidesRes.ok) {
        const slidesData = await slidesRes.json()
        setSlides(slidesData)
      }
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleLogout = () => {
    localStorage.removeItem('authToken')
    localStorage.removeItem('user')
    window.location.href = '/login'
  }

  const handleSlideSubmit = async (values: SlideFormValues) => {
    const userData = localStorage.getItem('user')
    const headers: HeadersInit = { 'Content-Type': 'application/json' }
    if (userData) headers['x-user'] = userData

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
    const userData = localStorage.getItem('user')
    const headers: HeadersInit = {}
    if (userData) headers['x-user'] = userData

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
              <h1 className="text-2xl font-bold">Staff Dashboard</h1>
              <Badge variant="outline">Gate Operator</Badge>
              {user && (
                <div className="text-sm text-muted-foreground">
                  Selamat datang, {user.name}
                </div>
              )}
            </div>
            <div className="flex items-center space-x-4">
              <ThemeToggle />
              <Button variant="ghost" asChild>
                <Link href="/gate">Gate Entry</Link>
              </Button>
              <Button variant="ghost" onClick={handleLogout}>
                <LogOut className="h-4 w-4 mr-2" />
                Keluar
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Scan</CardTitle>
              <QrCode className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalScans}</div>
              <p className="text-xs text-muted-foreground">
                Semua waktu
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Scan Valid</CardTitle>
              <CheckCircle className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{stats.validScans}</div>
              <p className="text-xs text-muted-foreground">
                Tiket valid
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Scan Invalid</CardTitle>
              <AlertTriangle className="h-4 w-4 text-red-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">{stats.invalidScans}</div>
              <p className="text-xs text-muted-foreground">
                Tiket tidak valid
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Scan Hari Ini</CardTitle>
              <TrendingUp className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.todayScans}</div>
              <p className="text-xs text-muted-foreground">
                Hari ini
              </p>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Gate Entries Status */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <MapPin className="h-5 w-5 mr-2" />
                Status Gate Entry
              </CardTitle>
              <CardDescription>
                Status semua gate yang tersedia
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {gateEntries.map((gate) => (
                  <div key={gate.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div>
                      <p className="font-medium">{gate.name}</p>
                      <p className="text-sm text-muted-foreground">{gate.location}</p>
                    </div>
                    <div className="text-right">
                      <Badge variant={gate.isActive ? "default" : "secondary"}>
                        {gate.isActive ? "Aktif" : "Non-aktif"}
                      </Badge>
                      <p className="text-xs text-muted-foreground mt-1">
                        {gate._count.gateScans} scan
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Recent Scans */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Clock className="h-5 w-5 mr-2" />
                Scan Terbaru
              </CardTitle>
              <CardDescription>
                Aktivitas scan terakhir
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4 max-h-96 overflow-y-auto">
                {recentScans.length === 0 ? (
                  <div className="text-center py-8">
                    <Activity className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                    <p className="text-muted-foreground">Belum ada aktivitas scan</p>
                  </div>
                ) : (
                  recentScans.map((scan) => (
                    <div key={scan.id} className="border rounded-lg p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center space-x-2 mb-2">
                            <Badge variant={scan.isValid ? "default" : "destructive"}>
                              {scan.isValid ? "Valid" : "Invalid"}
                            </Badge>
                            <span className="text-xs text-muted-foreground">
                              {formatDate(scan.scanTime)}
                            </span>
                          </div>
                          <p className="font-medium">{scan.ticket.event.title}</p>
                          <p className="text-sm text-muted-foreground">
                            {scan.ticket.ticketType.name} - {scan.ticket.user.name}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            Gate: {scan.gateEntry.name}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <div className="mt-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Aksi Cepat</CardTitle>
                <CardDescription>
                  Akses cepat ke fitur yang sering digunakan
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Button asChild className="w-full">
                    <Link href="/gate">
                      <QrCode className="h-4 w-4 mr-2" />
                      Scan Tiket
                    </Link>
                  </Button>
                  <Button variant="outline" asChild className="w-full">
                    <Link href="/my-tickets">
                      <Users className="h-4 w-4 mr-2" />
                      Tiket Saya
                    </Link>
                  </Button>
                  <Button variant="outline" asChild className="w-full">
                    <Link href="/">
                      <Calendar className="h-4 w-4 mr-2" />
                      Lihat Event
                    </Link>
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>Kelola Slider</CardTitle>
                  <CardDescription>
                    Tambah atau edit gambar slider landing page
                  </CardDescription>
                </div>
                <Button onClick={() => {
                  setEditingSlide(null)
                  setSlideModalOpen(true)
                }}>
                  <Plus className="h-4 w-4 mr-2" /> Tambah
                </Button>
              </CardHeader>
              <CardContent>
                {slides.length === 0 ? (
                  <p className="text-sm text-muted-foreground">Belum ada slide</p>
                ) : (
                  <div className="space-y-4">
                    {slides.map((slide) => (
                      <div key={slide.id} className="border rounded-lg p-4 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                        <div className="flex items-start gap-4">
                          <div className="relative h-20 w-32 overflow-hidden rounded-lg bg-muted">
                            <img src={slide.imageUrl} alt={slide.title} className="h-full w-full object-cover" />
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <p className="font-semibold">{slide.title}</p>
                              <Badge variant={slide.isActive ? 'default' : 'secondary'}>
                                {slide.isActive ? 'Aktif' : 'Non-aktif'}
                              </Badge>
                            </div>
                            {slide.subtitle && <p className="text-sm text-muted-foreground line-clamp-2">{slide.subtitle}</p>}
                            <p className="text-xs text-muted-foreground mt-1">Urutan: {slide.sortOrder}</p>
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
          </div>
        </div>
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
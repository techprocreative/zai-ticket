'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { 
  Mail, 
  Phone, 
  MessageCircle, 
  HelpCircle, 
  BookOpen, 
  Users,
  Ticket,
  QrCode,
  AlertTriangle,
  CheckCircle
} from 'lucide-react'
import Link from 'next/link'
import { ThemeToggle } from '@/components/theme-toggle'

export default function HelpPage() {
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-card border-b sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <h1 className="text-2xl font-bold">Bantuan</h1>
              <Badge variant="outline">Pusat Bantuan</Badge>
            </div>
            <div className="flex items-center space-x-4">
              <ThemeToggle />
              <Button variant="ghost" asChild>
                <Link href="/login">Masuk</Link>
              </Button>
              <Button variant="ghost" asChild>
                <Link href="/">Beranda</Link>
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          {/* Hero Section */}
          <div className="text-center mb-12">
            <HelpCircle className="h-16 w-16 mx-auto mb-4 text-primary" />
            <h2 className="text-3xl font-bold mb-4">Bagaimana kami bisa membantu?</h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Temukan jawaban untuk pertanyaan umum atau hubungi tim support kami
            </p>
          </div>

          {/* Quick Help */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
            <Card className="hover:shadow-lg transition-shadow cursor-pointer">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <BookOpen className="h-5 w-5 mr-2" />
                  Panduan Pengguna
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-4">
                  Pelajari cara menggunakan platform TiketKu
                </p>
                <Button variant="outline" size="sm" className="w-full">
                  Baca Panduan
                </Button>
              </CardContent>
            </Card>

            <Card className="hover:shadow-lg transition-shadow cursor-pointer">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Ticket className="h-5 w-5 mr-2" />
                  Cara Beli Tiket
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-4">
                  Langkah demi langkah pembelian tiket online
                </p>
                <Button variant="outline" size="sm" className="w-full">
                  Pelajari Lebih
                </Button>
              </CardContent>
            </Card>

            <Card className="hover:shadow-lg transition-shadow cursor-pointer">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <QrCode className="h-5 w-5 mr-2" />
                  Validasi Tiket
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-4">
                  Cara menggunakan QR code untuk masuk event
                </p>
                <Button variant="outline" size="sm" className="w-full">
                  Lihat Tutorial
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* FAQ Section */}
          <Card className="mb-12">
            <CardHeader>
              <CardTitle>Pertanyaan yang Sering Diajukan (FAQ)</CardTitle>
              <CardDescription>
                Jawaban untuk pertanyaan umum tentang TiketKu
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div className="border rounded-lg p-4">
                  <h4 className="font-medium mb-2 flex items-center">
                    <AlertTriangle className="h-4 w-4 mr-2 text-orange-500" />
                    Bagaimana cara membeli tiket?
                  </h4>
                  <p className="text-sm text-muted-foreground">
                    1. Pilih event yang diinginkan dari beranda<br/>
                    2. Klik "Beli Tiket" pada event<br/>
                    3. Pilih tipe tiket dan jumlah<br/>
                    4. Isi data pembeli dan lanjut ke pembayaran<br/>
                    5. Selesaikan pembayaran dan dapatkan tiket digital
                  </p>
                </div>

                <div className="border rounded-lg p-4">
                  <h4 className="font-medium mb-2 flex items-center">
                    <CheckCircle className="h-4 w-4 mr-2 text-green-500" />
                    Apa yang terjadi setelah pembayaran?
                  </h4>
                  <p className="text-sm text-muted-foreground">
                    Setelah pembayaran berhasil, Anda akan menerima:<br/>
                    • Email konfirmasi dengan detail tiket<br/>
                    • Tiket digital dengan QR code<br/>
                    • Notifikasi di dashboard "Tiket Saya"
                  </p>
                </div>

                <div className="border rounded-lg p-4">
                  <h4 className="font-medium mb-2 flex items-center">
                    <QrCode className="h-4 w-4 mr-2 text-primary" />
                    Bagaimana cara menggunakan tiket?
                  </h4>
                  <p className="text-sm text-muted-foreground">
                    1. Buka email atau dashboard "Tiket Saya"<br/>
                    2. Tunjukkan QR code di pintu masuk event<br/>
                    3. Petugas akan memindai QR code untuk validasi<br/>
                    4. Jika valid, Anda dapat masuk event
                  </p>
                </div>

                <div className="border rounded-lg p-4">
                  <h4 className="font-medium mb-2 flex items-center">
                    <AlertTriangle className="h-4 w-4 mr-2 text-orange-500" />
                    Apa yang harus dilakukan jika QR code tidak bisa dibaca?
                  </h4>
                  <p className="text-sm text-muted-foreground">
                    • Pastikan QR code tidak rusak atau terpotong<br/>
                    • Coba di lokasi dengan cahaya yang cukup<br/>
                    • Perbesar tampilan di smartphone<br/>
                    • Hubungi petugas jika masalah berlanjut
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Contact Support */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Mail className="h-5 w-5 mr-2" />
                  Hubungi via Email
                </CardTitle>
                <CardDescription>
                  Kirim email ke tim support kami
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <p className="text-sm font-medium">Email Support</p>
                  <p className="text-sm text-muted-foreground">support@tiketku.com</p>
                </div>
                <div className="space-y-2">
                  <p className="text-sm font-medium">Waktu Respon</p>
                  <p className="text-sm text-muted-foreground">1x24 jam pada hari kerja</p>
                </div>
                <Button className="w-full">
                  <Mail className="h-4 w-4 mr-2" />
                  Kirim Email
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Phone className="h-5 w-5 mr-2" />
                  Hubungi via Telepon
                </CardTitle>
                <CardDescription>
                  Hubungi hotline untuk bantuan segera
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <p className="text-sm font-medium">Hotline</p>
                  <p className="text-sm text-muted-foreground">+62 21 1234 5678</p>
                </div>
                <div className="space-y-2">
                  <p className="text-sm font-medium">WhatsApp</p>
                  <p className="text-sm text-muted-foreground">+62 812 3456 7890</p>
                </div>
                <div className="space-y-2">
                  <p className="text-sm font-medium">Jam Operasional</p>
                  <p className="text-sm text-muted-foreground">Senin - Jumat: 08:00 - 20:00</p>
                  <p className="text-sm text-muted-foreground">Sabtu - Minggu: 09:00 - 18:00</p>
                </div>
                <Button className="w-full">
                  <Phone className="h-4 w-4 mr-2" />
                  Hubungi Sekarang
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* Live Chat */}
          <Card className="mb-12">
            <CardHeader>
              <CardTitle className="flex items-center">
                <MessageCircle className="h-5 w-5 mr-2" />
                Live Chat Support
              </CardTitle>
              <CardDescription>
                Chat langsung dengan tim support kami
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center space-y-4">
                <p className="text-sm text-muted-foreground">
                  Tersedia setiap hari untuk membantu Anda
                </p>
                <div className="flex justify-center space-x-4">
                  <Button variant="outline">
                    <MessageCircle className="h-4 w-4 mr-2" />
                    Mulai Chat
                  </Button>
                  <Button variant="outline">
                    <Users className="h-4 w-4 mr-2" />
                    Komunitas
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Emergency Contacts */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center text-red-600">
                <AlertTriangle className="h-5 w-5 mr-2" />
                Kontak Darurat
              </CardTitle>
              <CardDescription>
                Untuk situasi darurat saat event berlangsung
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <p className="text-sm font-medium">Security Event</p>
                  <p className="text-sm text-muted-foreground">+62 811 222 3333</p>
                </div>
                <div className="space-y-2">
                  <p className="text-sm font-medium">Medical Emergency</p>
                  <p className="text-sm text-muted-foreground">+62 118 (Ambulance)</p>
                </div>
              </div>
              <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-sm text-red-800">
                  <strong>Penting:</strong> Simpan nomor-nomor ini di smartphone Anda saat menghadiri event.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
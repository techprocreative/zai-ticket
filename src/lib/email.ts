import { Resend } from 'resend'
import { env } from './env'

type EmailTemplate =
  | 'verification'
  | 'password-reset'
  | 'order-confirmation'
  | 'payment-reminder'
  | 'order-cancelled'
  | 'ticket-delivery'

interface SendEmailParams {
  to: string
  subject: string
  template: EmailTemplate
  data: Record<string, any>
}

/**
 * Email service using Resend
 * Supports both development (console logging) and production (Resend API)
 */

// Initialize Resend client for production
let resend: Resend | null = null
if (env.NODE_ENV === 'production' && env.RESEND_API_KEY) {
  resend = new Resend(env.RESEND_API_KEY)
}

/**
 * Email templates
 */
function getEmailContent(template: EmailTemplate, data: Record<string, any>) {
  const templates = {
    verification: {
      subject: 'Verifikasi Email TiketKu',
      text: `
Halo ${data.name || 'User'},

Terima kasih telah mendaftar di TiketKu!

Klik link berikut untuk verifikasi email Anda:
${data.verificationUrl}

Link ini berlaku selama 24 jam.

Jika Anda tidak membuat akun, abaikan email ini.

Salam,
Tim TiketKu
      `,
      html: `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .button { display: inline-block; padding: 12px 24px; background-color: #4F46E5; color: white; text-decoration: none; border-radius: 6px; margin: 20px 0; }
    .footer { margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee; font-size: 12px; color: #666; }
  </style>
</head>
<body>
  <div class="container">
    <h2>Verifikasi Email Anda</h2>
    <p>Halo ${data.name || 'User'},</p>
    <p>Terima kasih telah mendaftar di TiketKu! Klik tombol di bawah untuk verifikasi email Anda:</p>
    <a href="${data.verificationUrl}" class="button">Verifikasi Email</a>
    <p>Atau copy link berikut ke browser Anda:<br><a href="${data.verificationUrl}">${data.verificationUrl}</a></p>
    <p>Link ini berlaku selama 24 jam.</p>
    <p>Jika Anda tidak membuat akun, abaikan email ini.</p>
    <div class="footer">
      <p>Salam,<br>Tim TiketKu</p>
    </div>
  </div>
</body>
</html>
      `
    },
    'password-reset': {
      subject: 'Reset Password TiketKu',
      text: `
Halo ${data.name || 'User'},

Kami menerima permintaan untuk reset password akun TiketKu Anda.

Klik link berikut untuk reset password:
${data.resetUrl}

Link ini berlaku selama 1 jam.

Jika Anda tidak meminta reset password, abaikan email ini atau hubungi kami jika Anda khawatir.

Salam,
Tim TiketKu
      `,
      html: `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .button { display: inline-block; padding: 12px 24px; background-color: #4F46E5; color: white; text-decoration: none; border-radius: 6px; margin: 20px 0; }
    .footer { margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee; font-size: 12px; color: #666; }
  </style>
</head>
<body>
  <div class="container">
    <h2>Reset Password</h2>
    <p>Halo ${data.name || 'User'},</p>
    <p>Kami menerima permintaan untuk reset password akun TiketKu Anda.</p>
    <a href="${data.resetUrl}" class="button">Reset Password</a>
    <p>Atau copy link berikut ke browser Anda:<br><a href="${data.resetUrl}">${data.resetUrl}</a></p>
    <p>Link ini berlaku selama 1 jam.</p>
    <p>Jika Anda tidak meminta reset password, abaikan email ini.</p>
    <div class="footer">
      <p>Salam,<br>Tim TiketKu</p>
    </div>
  </div>
</body>
</html>
      `
    },
    'order-confirmation': {
      subject: `Pesanan Berhasil - #${data.orderId}`,
      text: `
Halo ${data.name},

Terima kasih! Pembayaran Anda telah berhasil dikonfirmasi.

Detail Pesanan:
- Order ID: ${data.orderId}
- Event: ${data.eventTitle}
- Jumlah Tiket: ${data.ticketCount}
- Total: Rp ${data.totalAmount?.toLocaleString('id-ID')}

Tiket Anda akan dikirim dalam email terpisah. Simpan QR code tiket untuk ditunjukkan saat masuk event.

Terima kasih telah menggunakan TiketKu!

Salam,
Tim TiketKu
      `,
      html: `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .success { background-color: #10B981; color: white; padding: 15px; border-radius: 6px; margin: 20px 0; }
    .details { background-color: #F3F4F6; padding: 15px; border-radius: 6px; margin: 20px 0; }
    .footer { margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee; font-size: 12px; color: #666; }
  </style>
</head>
<body>
  <div class="container">
    <div class="success">
      <h2 style="margin:0;">✓ Pembayaran Berhasil!</h2>
    </div>
    <p>Halo ${data.name},</p>
    <p>Terima kasih! Pembayaran Anda telah berhasil dikonfirmasi.</p>
    <div class="details">
      <h3>Detail Pesanan</h3>
      <p><strong>Order ID:</strong> ${data.orderId}</p>
      <p><strong>Event:</strong> ${data.eventTitle}</p>
      <p><strong>Jumlah Tiket:</strong> ${data.ticketCount}</p>
      <p><strong>Total:</strong> Rp ${data.totalAmount?.toLocaleString('id-ID')}</p>
    </div>
    <p>Tiket Anda akan dikirim dalam email terpisah. Simpan QR code tiket untuk ditunjukkan saat masuk event.</p>
    <div class="footer">
      <p>Terima kasih telah menggunakan TiketKu!<br>Tim TiketKu</p>
    </div>
  </div>
</body>
</html>
      `
    },
    'payment-reminder': {
      subject: `Segera Selesaikan Pembayaran - #${data.orderId}`,
      text: `
Halo ${data.name},

Pesanan Anda menunggu pembayaran!

Detail Pesanan:
- Order ID: ${data.orderId}
- Event: ${data.eventTitle}
- Total: Rp ${data.totalAmount?.toLocaleString('id-ID')}
- Batas Waktu: ${data.expiresAt}

Selesaikan pembayaran sebelum waktu habis untuk mendapatkan tiket Anda.

Link Pembayaran: ${data.paymentUrl}

Salam,
Tim TiketKu
      `,
      html: `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .warning { background-color: #F59E0B; color: white; padding: 15px; border-radius: 6px; margin: 20px 0; }
    .button { display: inline-block; padding: 12px 24px; background-color: #4F46E5; color: white; text-decoration: none; border-radius: 6px; margin: 20px 0; }
    .footer { margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee; font-size: 12px; color: #666; }
  </style>
</head>
<body>
  <div class="container">
    <div class="warning">
      <h2 style="margin:0;">⏰ Pesanan Menunggu Pembayaran</h2>
    </div>
    <p>Halo ${data.name},</p>
    <p>Pesanan Anda <strong>#${data.orderId}</strong> untuk event <strong>${data.eventTitle}</strong> menunggu pembayaran.</p>
    <p><strong>Total: Rp ${data.totalAmount?.toLocaleString('id-ID')}</strong></p>
    <p><strong>Batas Waktu: ${data.expiresAt}</strong></p>
    <a href="${data.paymentUrl}" class="button">Bayar Sekarang</a>
    <p>Selesaikan pembayaran sebelum waktu habis untuk mendapatkan tiket Anda.</p>
    <div class="footer">
      <p>Salam,<br>Tim TiketKu</p>
    </div>
  </div>
</body>
</html>
      `
    },
    'order-cancelled': {
      subject: `Pesanan Dibatalkan - #${data.orderId}`,
      text: `
Halo ${data.name},

Pesanan Anda #${data.orderId} telah dibatalkan karena pembayaran tidak diselesaikan dalam waktu yang ditentukan.

Anda dapat membuat pesanan baru kapan saja.

Salam,
Tim TiketKu
      `,
      html: `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .footer { margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee; font-size: 12px; color: #666; }
  </style>
</head>
<body>
  <div class="container">
    <h2>Pesanan Dibatalkan</h2>
    <p>Halo ${data.name},</p>
    <p>Pesanan Anda <strong>#${data.orderId}</strong> telah dibatalkan karena pembayaran tidak diselesaikan dalam waktu yang ditentukan.</p>
    <p>Anda dapat membuat pesanan baru kapan saja di TiketKu.</p>
    <div class="footer">
      <p>Salam,<br>Tim TiketKu</p>
    </div>
  </div>
</body>
</html>
      `
    },
    'ticket-delivery': {
      subject: `Tiket Anda - ${data.eventTitle}`,
      text: `
Halo ${data.name},

Berikut tiket Anda untuk event: ${data.eventTitle}

Order ID: ${data.orderId}
Jumlah Tiket: ${data.ticketCount}

Tunjukkan QR code pada tiket saat masuk event.

Sampai jumpa di event!

Salam,
Tim TiketKu
      `,
      html: `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .ticket-info { background-color: #EEF2FF; padding: 15px; border-radius: 6px; margin: 20px 0; }
    .footer { margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee; font-size: 12px; color: #666; }
  </style>
</head>
<body>
  <div class="container">
    <h2>🎟️ Tiket Anda</h2>
    <p>Halo ${data.name},</p>
    <div class="ticket-info">
      <h3>${data.eventTitle}</h3>
      <p><strong>Order ID:</strong> ${data.orderId}</p>
      <p><strong>Jumlah Tiket:</strong> ${data.ticketCount}</p>
    </div>
    <p>Tunjukkan QR code pada tiket saat masuk event.</p>
    <p><strong>Penting:</strong> Simpan email ini atau download tiket Anda.</p>
    <div class="footer">
      <p>Sampai jumpa di event!<br>Tim TiketKu</p>
    </div>
  </div>
</body>
</html>
      `
    }
  }

  return templates[template]
}

/**
 * Send email using Resend or console log in development
 */
export async function sendEmail({ to, subject, template, data }: SendEmailParams) {
  const emailContent = getEmailContent(template, data)
  const finalSubject = subject || emailContent.subject

  // Development: Log to console
  if (env.NODE_ENV === 'development') {
    console.log('\n=== EMAIL SENT (DEV) ===')
    console.log('To:', to)
    console.log('Subject:', finalSubject)
    console.log('Template:', template)
    console.log('Text:', emailContent.text)
    console.log('========================\n')
    return { success: true, id: 'dev-email-' + Date.now() }
  }

  // Production: Use Resend
  if (!resend) {
    console.error('Resend client not initialized. Check RESEND_API_KEY.')
    throw new Error('Email service not configured for production')
  }

  try {
    const result = await resend.emails.send({
      from: env.EMAIL_FROM,
      to,
      subject: finalSubject,
      text: emailContent.text,
      html: emailContent.html
    })

    console.log('Email sent successfully:', result.data?.id)
    return { success: true, id: result.data?.id }
  } catch (error) {
    console.error('Failed to send email:', error)
    throw error
  }
}

/**
 * Send bulk emails (for notifications, reminders, etc.)
 */
export async function sendBulkEmails(emails: SendEmailParams[]): Promise<{ success: number; failed: number }> {
  let success = 0
  let failed = 0

  for (const email of emails) {
    try {
      await sendEmail(email)
      success++
    } catch (error) {
      console.error(`Failed to send email to ${email.to}:`, error)
      failed++
    }
  }

  return { success, failed }
}

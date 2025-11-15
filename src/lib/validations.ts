import { z } from 'zod'

// User Validations
export const loginSchema = z.object({
  email: z.string().email('Email tidak valid'),
  password: z.string().min(6, 'Password minimal 6 karakter'),
})

export const registerSchema = z.object({
  email: z.string().email('Email tidak valid'),
  password: z.string().min(6, 'Password minimal 6 karakter'),
  name: z.string().min(2, 'Nama minimal 2 karakter').optional(),
  phone: z.string().regex(/^(\+62|62|0)[0-9]{9,12}$/, 'Nomor telepon tidak valid').optional(),
})

export const userCreateSchema = z.object({
  email: z.string().email('Email tidak valid'),
  name: z.string().min(2, 'Nama minimal 2 karakter').optional(),
  phone: z.string().regex(/^(\+62|62|0)[0-9]{9,12}$/, 'Nomor telepon tidak valid').optional(),
})

// Event Validations
export const eventCreateSchema = z.object({
  title: z.string().min(3, 'Judul minimal 3 karakter'),
  description: z.string().min(10, 'Deskripsi minimal 10 karakter'),
  venue: z.string().min(3, 'Venue minimal 3 karakter'),
  address: z.string().min(5, 'Alamat minimal 5 karakter'),
  startDate: z.string().datetime('Format tanggal tidak valid'),
  endDate: z.string().datetime('Format tanggal tidak valid'),
  maxCapacity: z.number().int().min(1, 'Kapasitas minimal 1'),
  imageUrl: z.string().url('URL gambar tidak valid').optional(),
})

export const eventUpdateSchema = eventCreateSchema.partial()

// Ticket Type Validations
export const ticketTypeCreateSchema = z.object({
  eventId: z.string().cuid('Event ID tidak valid'),
  name: z.string().min(2, 'Nama tiket minimal 2 karakter'),
  description: z.string().optional(),
  price: z.number().min(0, 'Harga tidak boleh negatif'),
  maxQuantity: z.number().int().min(1, 'Quantity minimal 1'),
})

export const ticketTypeUpdateSchema = ticketTypeCreateSchema.partial().omit({ eventId: true })

// Order Validations
export const orderCreateSchema = z.object({
  userId: z.string().cuid('User ID tidak valid'),
  eventId: z.string().cuid('Event ID tidak valid'),
  items: z.array(
    z.object({
      ticketTypeId: z.string().cuid('Ticket Type ID tidak valid'),
      quantity: z.number().int().min(1, 'Quantity minimal 1'),
    })
  ).min(1, 'Minimal 1 item'),
  customerInfo: z.object({
    name: z.string().min(2, 'Nama minimal 2 karakter'),
    email: z.string().email('Email tidak valid'),
    phone: z.string().regex(/^(\+62|62|0)[0-9]{9,12}$/, 'Nomor telepon tidak valid'),
  }),
})

export const orderUpdateSchema = z.object({
  status: z.enum(['PENDING', 'PAID', 'CANCELLED', 'REFUNDED']),
})

// Ticket Validation
export const ticketValidateSchema = z.object({
  qrCode: z.string().min(1, 'QR Code tidak boleh kosong'),
  gateEntryId: z.string().cuid('Gate Entry ID tidak valid').optional(),
})

// Gate Entry Validations
export const gateEntryCreateSchema = z.object({
  eventId: z.string().cuid('Event ID tidak valid'),
  name: z.string().min(2, 'Nama gate minimal 2 karakter'),
  location: z.string().optional(),
  isActive: z.boolean().default(true),
})

export const gateEntryUpdateSchema = gateEntryCreateSchema.partial().omit({ eventId: true })

// Payment Validations
export const paymentCreateSchema = z.object({
  orderId: z.string().cuid('Order ID tidak valid'),
  paymentMethod: z.enum(['bank_transfer', 'credit_card', 'e_wallet', 'qris']),
})

export const paymentWebhookSchema = z.object({
  order_id: z.string(),
  transaction_status: z.string(),
  fraud_status: z.string().optional(),
  payment_type: z.string(),
  gross_amount: z.string(),
  signature_key: z.string(),
})

// Helper function untuk validasi request
export function validateRequest<T>(schema: z.ZodSchema<T>, data: unknown): { success: true; data: T } | { success: false; errors: string[] } {
  const result = schema.safeParse(data)

  if (result.success) {
    return { success: true, data: result.data }
  }

  const errors = result.error.issues.map(err => {
    const path = err.path.join('.')
    return path ? `${path}: ${err.message}` : err.message
  })

  return { success: false, errors }
}

// Type exports for TypeScript
export type LoginInput = z.infer<typeof loginSchema>
export type RegisterInput = z.infer<typeof registerSchema>
export type UserCreateInput = z.infer<typeof userCreateSchema>
export type EventCreateInput = z.infer<typeof eventCreateSchema>
export type EventUpdateInput = z.infer<typeof eventUpdateSchema>
export type TicketTypeCreateInput = z.infer<typeof ticketTypeCreateSchema>
export type TicketTypeUpdateInput = z.infer<typeof ticketTypeUpdateSchema>
export type OrderCreateInput = z.infer<typeof orderCreateSchema>
export type OrderUpdateInput = z.infer<typeof orderUpdateSchema>
export type TicketValidateInput = z.infer<typeof ticketValidateSchema>
export type GateEntryCreateInput = z.infer<typeof gateEntryCreateSchema>
export type GateEntryUpdateInput = z.infer<typeof gateEntryUpdateSchema>
export type PaymentCreateInput = z.infer<typeof paymentCreateSchema>
export type PaymentWebhookInput = z.infer<typeof paymentWebhookSchema>

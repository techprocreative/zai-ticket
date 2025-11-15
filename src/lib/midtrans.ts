import { env } from './env'
import crypto from 'crypto'

/**
 * Midtrans Snap API Integration
 * Documentation: https://docs.midtrans.com/en/snap/overview
 */

export interface MidtransTransactionItem {
  id: string
  price: number
  quantity: number
  name: string
}

export interface MidtransCustomerDetails {
  first_name: string
  last_name?: string
  email: string
  phone: string
}

export interface MidtransTransactionDetails {
  order_id: string
  gross_amount: number
}

export interface MidtransSnapParams {
  transaction_details: MidtransTransactionDetails
  item_details: MidtransTransactionItem[]
  customer_details: MidtransCustomerDetails
  callbacks?: {
    finish?: string
  }
}

export interface MidtransSnapResponse {
  token: string
  redirect_url: string
}

export interface MidtransNotification {
  transaction_time: string
  transaction_status: string
  transaction_id: string
  status_message: string
  status_code: string
  signature_key: string
  payment_type: string
  order_id: string
  merchant_id: string
  gross_amount: string
  fraud_status: string
  currency: string
}

/**
 * Midtrans Snap API client
 */
class MidtransClient {
  private serverKey: string
  private isProduction: boolean
  private baseUrl: string

  constructor() {
    this.serverKey = env.MIDTRANS_SERVER_KEY || ''
    this.isProduction = env.MIDTRANS_IS_PRODUCTION === 'true'
    this.baseUrl = this.isProduction
      ? 'https://app.midtrans.com/snap/v1'
      : 'https://app.sandbox.midtrans.com/snap/v1'
  }

  /**
   * Get Basic Auth header
   */
  private getAuthHeader(): string {
    const credentials = Buffer.from(this.serverKey + ':').toString('base64')
    return `Basic ${credentials}`
  }

  /**
   * Create Snap transaction token
   */
  async createTransaction(params: MidtransSnapParams): Promise<MidtransSnapResponse> {
    try {
      const response = await fetch(`${this.baseUrl}/transactions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': this.getAuthHeader(),
          'Accept': 'application/json'
        },
        body: JSON.stringify(params)
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(`Midtrans API error: ${error.error_messages?.join(', ') || response.statusText}`)
      }

      const data = await response.json()
      return {
        token: data.token,
        redirect_url: data.redirect_url
      }
    } catch (error) {
      console.error('Midtrans createTransaction error:', error)
      throw error
    }
  }

  /**
   * Get transaction status
   */
  async getTransactionStatus(orderId: string): Promise<MidtransNotification> {
    try {
      const apiUrl = this.isProduction
        ? 'https://api.midtrans.com/v2'
        : 'https://api.sandbox.midtrans.com/v2'

      const response = await fetch(`${apiUrl}/${orderId}/status`, {
        method: 'GET',
        headers: {
          'Authorization': this.getAuthHeader(),
          'Accept': 'application/json'
        }
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(`Midtrans API error: ${error.status_message || response.statusText}`)
      }

      return await response.json()
    } catch (error) {
      console.error('Midtrans getTransactionStatus error:', error)
      throw error
    }
  }

  /**
   * Verify notification signature
   * Security: Always verify webhook signatures to prevent fraud
   */
  verifySignature(notification: MidtransNotification): boolean {
    const { order_id, status_code, gross_amount, signature_key } = notification

    const hash = crypto
      .createHash('sha512')
      .update(`${order_id}${status_code}${gross_amount}${this.serverKey}`)
      .digest('hex')

    return hash === signature_key
  }

  /**
   * Map Midtrans transaction status to Order status
   */
  mapTransactionStatus(transactionStatus: string, fraudStatus?: string): 'PAID' | 'PENDING' | 'CANCELLED' {
    // Transaction successful
    if (transactionStatus === 'capture' || transactionStatus === 'settlement') {
      // For credit card, check fraud status
      if (fraudStatus === 'challenge') {
        return 'PENDING' // Waiting for merchant review
      } else if (fraudStatus === 'accept') {
        return 'PAID'
      }
      return 'PAID'
    }

    // Transaction pending
    if (transactionStatus === 'pending') {
      return 'PENDING'
    }

    // Transaction failed/cancelled
    if (['deny', 'cancel', 'expire'].includes(transactionStatus)) {
      return 'CANCELLED'
    }

    return 'PENDING'
  }

  /**
   * Get Snap.js script URL
   */
  getSnapScriptUrl(): string {
    return this.isProduction
      ? 'https://app.midtrans.com/snap/snap.js'
      : 'https://app.sandbox.midtrans.com/snap/snap.js'
  }

  /**
   * Get client key for Snap.js
   */
  getClientKey(): string {
    return env.MIDTRANS_CLIENT_KEY || ''
  }
}

// Export singleton instance
export const midtransClient = new MidtransClient()

/**
 * Helper: Generate Snap parameters from order data
 */
export function generateSnapParams(
  orderId: string,
  items: MidtransTransactionItem[],
  customer: MidtransCustomerDetails,
  callbackUrl?: string
): MidtransSnapParams {
  const gross_amount = items.reduce((sum, item) => sum + (item.price * item.quantity), 0)

  return {
    transaction_details: {
      order_id: orderId,
      gross_amount
    },
    item_details: items,
    customer_details: customer,
    callbacks: callbackUrl ? { finish: callbackUrl } : undefined
  }
}
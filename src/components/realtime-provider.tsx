'use client'

import { createContext, useContext, useEffect, useState } from 'react'
import { io, Socket } from 'socket.io-client'

interface TicketAvailability {
  ticketTypeId: string
  available: number
  total: number
  sold: number
  eventId: string
  eventTitle: string
}

interface RealtimeContextType {
  socket: Socket | null
  isConnected: boolean
  joinEvent: (eventId: string) => void
  leaveEvent: (eventId: string) => void
  checkAvailability: (ticketTypeId: string) => void
  availability: TicketAvailability[]
  subscribeToEvent: (eventId: string) => void
}

const RealtimeContext = createContext<RealtimeContextType>({
  socket: null,
  isConnected: false,
  joinEvent: () => {},
  leaveEvent: () => {},
  checkAvailability: () => {},
  availability: [],
  subscribeToEvent: () => {}
})

export const useRealtime = () => {
  const context = useContext(RealtimeContext)
  if (!context) {
    throw new Error('useRealtime must be used within RealtimeProvider')
  }
  return context
}

interface RealtimeProviderProps {
  children: React.ReactNode
}

export function RealtimeProvider({ children }: RealtimeProviderProps) {
  const [socket, setSocket] = useState<Socket | null>(null)
  const [isConnected, setIsConnected] = useState(false)
  const [availability, setAvailability] = useState<TicketAvailability[]>([])

  useEffect(() => {
    // Initialize socket connection
    const newSocket = io(process.env.NODE_ENV === 'production' ? '' : 'http://localhost:3000', {
      transports: ['websocket', 'polling']
    })

    newSocket.on('connect', () => {
      console.log('Connected to real-time server')
      setIsConnected(true)
    })

    newSocket.on('disconnect', () => {
      console.log('Disconnected from real-time server')
      setIsConnected(false)
    })

    newSocket.on('availability-update', (data: TicketAvailability) => {
      console.log('Availability update received:', data)
      setAvailability(prev => {
        const existingIndex = prev.findIndex(item => item.ticketTypeId === data.ticketTypeId)
        if (existingIndex >= 0) {
          const updated = [...prev]
          updated[existingIndex] = data
          return updated
        } else {
          return [...prev, data]
        }
      })
    })

    newSocket.on('availability-response', (data: TicketAvailability) => {
      console.log('Availability response received:', data)
      setAvailability(prev => {
        const existingIndex = prev.findIndex(item => item.ticketTypeId === data.ticketTypeId)
        if (existingIndex >= 0) {
          const updated = [...prev]
          updated[existingIndex] = data
          return updated
        } else {
          return [...prev, data]
        }
      })
    })

    newSocket.on('error', (error) => {
      console.error('Socket error:', error)
    })

    setSocket(newSocket)

    return () => {
      newSocket.disconnect()
    }
  }, [])

  const joinEvent = (eventId: string) => {
    if (socket) {
      socket.emit('join-event', eventId)
    }
  }

  const leaveEvent = (eventId: string) => {
    if (socket) {
      socket.emit('leave-event', eventId)
    }
  }

  const checkAvailability = (ticketTypeId: string) => {
    if (socket) {
      socket.emit('check-availability', ticketTypeId)
    }
  }

  const subscribeToEvent = (eventId: string) => {
    if (socket) {
      socket.emit('join-event', eventId)
    }
  }

  const value: RealtimeContextType = {
    socket,
    isConnected,
    joinEvent,
    leaveEvent,
    checkAvailability,
    availability,
    subscribeToEvent
  }

  return (
    <RealtimeContext.Provider value={value}>
      {children}
    </RealtimeContext.Provider>
  )
}
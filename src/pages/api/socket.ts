import { Server as NetServer } from 'http'
import { NextApiRequest, NextApiResponse } from 'next'
import { Server as SocketIOServer } from 'socket.io'
import { db } from '@/lib/db'

export const config = {
  api: {
    bodyParser: false,
  },
}

let io: SocketIOServer | null

const socketHandler = (req: NextApiRequest, res: NextApiResponse & { socket: any }) => {
  if (!res.socket.server.io) {
    console.log('Initializing Socket.IO server...')
    
    const httpServer: NetServer = res.socket.server as any
    io = new SocketIOServer(httpServer, {
      cors: {
        origin: "*",
        methods: ["GET", "POST"]
      }
    })

    res.socket.server.io = io

    io.on('connection', (socket) => {
      console.log('Client connected:', socket.id)

      // Join event-specific rooms
      socket.on('join-event', (eventId: string) => {
        socket.join(`event-${eventId}`)
        console.log(`Socket ${socket.id} joined event ${eventId}`)
      })

      // Leave event rooms
      socket.on('leave-event', (eventId: string) => {
        socket.leave(`event-${eventId}`)
        console.log(`Socket ${socket.id} left event ${eventId}`)
      })

      // Handle ticket availability requests
      socket.on('check-availability', async (ticketTypeId: string) => {
        try {
          const ticketType = await db.ticketType.findUnique({
            where: { id: ticketTypeId },
            include: {
              event: {
                select: {
                  id: true,
                  title: true
                }
              }
            }
          })

          if (ticketType && io) {
            const available = ticketType.maxQuantity - ticketType.soldQuantity
            
            // Send to specific event room
            io.to(`event-${ticketType.eventId}`).emit('availability-update', {
              ticketTypeId,
              available,
              total: ticketType.maxQuantity,
              sold: ticketType.soldQuantity,
              eventId: ticketType.eventId,
              eventTitle: ticketType.event.title
            })

            // Send to requesting client
            socket.emit('availability-response', {
              ticketTypeId,
              available,
              total: ticketType.maxQuantity,
              sold: ticketType.soldQuantity
            })
          }
        } catch (error) {
          console.error('Error checking availability:', error)
          socket.emit('error', { message: 'Failed to check availability' })
        }
      })

      // Handle disconnection
      socket.on('disconnect', () => {
        console.log('Client disconnected:', socket.id)
      })
    })

    console.log('Socket.IO server initialized')
  }
  
  res.end()
}

export default socketHandler
import { createServer } from 'http'
import { Server, Socket } from 'socket.io'
import handler from '../.output/server/index.mjs';

const httpServer = createServer(handler)

const io = new Server(httpServer, {
  path: '/socket.io',
  cors: {
    origin: '*',
    methods: ['GET', 'POST']
  }
})

io.on('connection', (socket: Socket) => {
  console.log('🟢 Подключение сокета:', socket.id)

  socket.on('joinRoom', async (user, room, callback) => {
    socket.join(room)

    const responseMessage = await fetch(`http://localhost:3000/api/message/room/${room}`)
      .then(res => res.json())
      .catch(e => ({ body: { messages: [] }, error: e }))

    socket.broadcast.to(room).emit('joinMessage', {
      message: `${user.email} joined the room ${room}`,
      user,
      room
    })

    callback?.(responseMessage.body.messages)
  })

  socket.on('leaveRoom', (room: string, callback: (response: string) => void) => {
    socket.leave(room)
    socket.broadcast.to(room).emit('leaveMessage', {
      message: `A user left the room ${room}`,
      room
    })
    callback?.(room)
  })

  socket.on('sendMessage', async (message: string, user, room, callback) => {
    const responseMessage = await fetch('http://localhost:3000/api/message', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        content: message,
        senderId: user.id,
        room
      })
    }).then(res => res.json())

    io.to(room).emit('message', responseMessage.body.message)
    callback?.(responseMessage.body.message)
  })
})

httpServer.listen(3000, () => {
  console.log('🚀 Nuxt + Socket.IO работает на http://localhost:3000')
})

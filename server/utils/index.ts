// import { Server, type ServerOptions, type Socket } from 'socket.io';
// import { H3Event } from 'h3';
// import { User } from '~/store/user.store';


// const options: Partial<ServerOptions> = {
//   path: '/api/socket.io',
//   serveClient: false,
// }

// export const io = new Server(options);

// export const initSocket = (event: H3Event) => {
//   // @ts-ignore
//   io.attach(event.node.res.socket?.server);

//   // TODO: Need to end chat
//   io.on('connection', (socket: Socket) => {
//     socket.on('joinRoom', async (user: User, room: string, callback: (response: any) => void) => {

//       socket.join(room);

//       const responseMessage = await $fetch(`/api/message/room/${room}`, {
//         method: 'GET'
//       });

//       socket.broadcast.to(room).emit('joinMessage', {
//         message: `${user.email} joined the room ${room}`,
//         user,
//         room,
//       });

//       callback(responseMessage.body.messages);
//     });

//     socket.on('leaveRoom', (room: string, callback: (response: string) => void) => {
//       socket.leave(room);
//       socket.broadcast.to(room).emit('leaveMessage', {
//         message: `A user left the room ${room}`,
//         room,
//       });
//       callback(room);
//     });

//     socket.on('sendMessage', async (message: string, user: User, room: string, callback: (response: any) => void) => {
//       const responseMessage = await $fetch('/api/message', {
//         method: 'POST',
//         body: {
//           content: message,
//           senderId: user.id,
//           room,
//         }
//       });

//       io.to(room).emit('message', responseMessage.body.message);
//       callback(responseMessage.body.message);
//     });
//   });
// };

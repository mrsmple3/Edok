import { createServer } from "http";
import { Server } from "socket.io";
import fetch from "node-fetch";

const PORT = process.env.PORT || 3000;

// Создаем простой HTTP сервер для Socket.IO
const httpServer = createServer();

const io = new Server(httpServer, {
	path: "/socket.io",
	cors: {
		origin: "*",
		methods: ["GET", "POST"],
	},
});

io.on("connection", (socket) => {
	console.log("🟢 Подключение сокета:", socket.id);

	socket.on("joinRoom", async (user, room, callback) => {
		socket.join(room);

		try {
			const response = await fetch(`http://localhost:3001/api/message/room/${room}`);
			const responseMessage = await response.json();

			socket.broadcast.to(room).emit("joinMessage", {
				message: `${user.email} joined the room ${room}`,
				user,
				room,
			});

			callback?.(responseMessage.body?.messages || []);
		} catch (error) {
			console.error("Ошибка загрузки сообщений:", error);
			callback?.([]);
		}
	});

	socket.on("leaveRoom", (room, callback) => {
		socket.leave(room);
		socket.broadcast.to(room).emit("leaveMessage", {
			message: `A user left the room ${room}`,
			room,
		});
		callback?.(room);
	});

	socket.on("sendMessage", async (message, user, room, callback) => {
		try {
			const response = await fetch("http://localhost:3001/api/message", {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify({
					content: message,
					senderId: user.id,
					room,
				}),
			});
			const responseMessage = await response.json();

			io.to(room).emit("message", responseMessage.body.message);
			callback?.(responseMessage.body.message);
		} catch (error) {
			console.error("Ошибка отправки сообщения:", error);
		}
	});

	socket.on("disconnect", () => {
		console.log("🔴 Сокет отключился:", socket.id);
	});
});

httpServer.listen(PORT, () => {
	console.log(`🚀 Socket.IO сервер работает на порту ${PORT}`);
});

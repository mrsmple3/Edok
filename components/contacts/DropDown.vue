<template>
	<DropdownMenu>
		<DropdownMenuTrigger class="absolute inset-0 w-full h-full"></DropdownMenuTrigger>
		<DropdownMenuContent align="end">
			<DropdownMenuItem @click="openDocument(invoice)">Показать документы</DropdownMenuItem>
			<DropdownMenuItem @click="openLead(invoice)">Показать угоды</DropdownMenuItem>
			<DropdownMenuItem @click="openChat(invoice)">Чат</DropdownMenuItem>
			<DropdownMenuItem class="text-red-600" @click="deleteContact(invoice)">Удалить</DropdownMenuItem>
		</DropdownMenuContent>
	</DropdownMenu>
</template>

<script setup lang="ts">
import { io, Socket } from "socket.io-client";
import { useAdminStore } from "~/store/admin.store";
import { useUserStore } from "~/store/user.store";

defineProps({
	invoice: {
		type: Object,
		required: true,
	},
});

const router = useRouter();
const route = useRoute();
const adminStore = useAdminStore();
const userStore = useUserStore();
const chatState = useState('isChat');

const openDocument = async (invoice: any) => {
	// await adminStore.getDocumentsByUserId(invoice.id).then(async () => {
	router.push({ path: "/user/docs", query: { id: invoice.id } });
	// });
};

const openLead = async (invoice: any) => {
	// await adminStore.getLeadByUserId(invoice.id).then(async () => {
	router.push({ path: "/user/leads", query: { id: invoice.id, role: invoice.role } });
	// });
};

const deleteContact = async (invoice: any) => {
	await adminStore.deleteUser(parseInt(invoice.id));
};

const openChat = async (invoice: any) => {

	router.push({ path: route.path, query: { room: 'all', id: invoice.id } });

	userStore.$state.socket = io({
		path: '/api/socket.io',
	});
	userStore.$state.socket.emit('joinRoom', invoice, `all${invoice.id}`, (response: any) => {
		console.log('Joined room:', response);
		userStore.setMessages(response);
	});
	userStore.$state.socket.on('joinMessage', (data: any) => {
		console.log('Received message:', data.message);
	});
	userStore.$state.socket.on('message', (message: any) => {
		console.log('New message received:', message);
		if (message.senderId === userStore.userGetter.id) {
			console.log('Сообщение отправлено текущим пользователем, пропускаем');
			return;
		}
		userStore.setMessage(message);
	});

	chatState.value = true;
}
</script>

<style scoped></style>

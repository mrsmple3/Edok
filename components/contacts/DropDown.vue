<template>
	<DropdownMenu>
		<DropdownMenuTrigger class="absolute right-0 top-0 bottom-0 w-[90%] h-full"></DropdownMenuTrigger>
		<DropdownMenuContent align="end">
			<DropdownMenuItem @click="openDocument(invoice)">Показати документи</DropdownMenuItem>
			<DropdownMenuItem @click="openLead(invoice)">Показати угоди</DropdownMenuItem>
			<DropdownMenuItem @click="openChat(invoice)">Чат</DropdownMenuItem>
			<DropdownMenuItem @click="toggleDeletePermission(invoice)"
				:class="invoice.canDeleterDocuments ? 'text-orange-600' : 'text-green-600'">
				<span class="flex items-center gap-2">
					<svg v-if="invoice.canDeleterDocuments" :class="['dropdown-icon']" fill="none" stroke="currentColor"
						viewBox="0 0 24 24">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
							d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728L5.636 5.636m12.728 12.728L18.364 5.636M5.636 18.364l12.728-12.728" />
					</svg>
					<svg v-else :class="['dropdown-icon']" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
							d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
					</svg>
					{{ invoice.canDeleterDocuments ? 'Заборонити видалення документів' : 'Дозволити видалення документів' }}
				</span>
			</DropdownMenuItem>
			<DropdownMenuItem class="text-red-600" @click="deleteContact(invoice)">Видалити</DropdownMenuItem>
		</DropdownMenuContent>
	</DropdownMenu>
</template>

<script setup lang="ts">
import { io, Socket } from "socket.io-client";
import { storeToRefs } from "pinia";
import { useToast } from '../ui/toast';
import { useAdminStore } from "../../store/admin.store";
import { useUserStore } from "../../store/user.store";

interface Props {
	user: any;
}

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
const { toast } = useToast();

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

const toggleDeletePermission = async (invoice: any) => {
	try {
		const updatedUser = {
			id: invoice.id,
			canDeleterDocuments: !invoice.canDeleterDocuments
		};

		await adminStore.patchUser(updatedUser);

		// Обновляем локальные данные пользователя
		invoice.canDeleterDocuments = !invoice.canDeleterDocuments;

		// Показываем успешное уведомление
		toast({
			title: "Права доступа обновлены",
			description: `${invoice.canDeleterDocuments ? 'Разрешено' : 'Запрещено'} удаление документов для пользователя ${invoice.name || invoice.email}`,
			variant: "default",
		});

		console.log(`Разрешение на удаление документов для пользователя ${invoice.name || invoice.email} ${invoice.canDeleterDocuments ? 'включено' : 'отключено'}`);
	} catch (error: any) {
		console.error('Ошибка при изменении разрешений:', error);

		// Показываем уведомление об ошибке
		toast({
			title: "Ошибка",
			description: error.message || "Не удалось изменить права доступа",
			variant: "destructive",
		});
	}
};

const openChat = async (invoice: any) => {

	router.push({ path: route.path, query: { room: 'all', id: invoice.id } });

	userStore.$state.socket = io({
		path: '/socket.io',
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

<style scoped lang="scss">
.dropdown-icon {
	width: size(16px);
	height: size(16px);
}

.permission-item {
	&.granted {
		color: #dc2626;
		/* red-600 для запрета */
	}

	&.denied {
		color: #16a34a;
		/* green-600 для разрешения */
	}
}
</style>

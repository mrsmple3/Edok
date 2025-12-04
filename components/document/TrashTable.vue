<template>
	<Table class="w-full">
		<TableHeader class="table-header">
			<TableRow class="border-none">
				<TableHead class="t-head">Назва</TableHead>
				<TableHead class="t-head">Створив</TableHead>
				<TableHead class="t-head">Тип</TableHead>
				<TableHead class="t-head">Підтвердження</TableHead>
				<TableHead class="t-head">Ініціатори видалення</TableHead>
				<TableHead class="t-head w-[220px]">Дії</TableHead>
			</TableRow>
		</TableHeader>
		<TableBody>
			<TableRow v-for="document in documents" :key="document.id">
				<TableCell>
					<div class="flex flex-col">
						<span class="font-medium text-base text-gray-900">{{ document.title }}</span>
						<span class="text-xs text-gray-500">№ {{ document.id }} · {{ formatDate(document.createdAt) }}</span>
					</div>
				</TableCell>
				<TableCell>
					<div class="flex flex-col">
						<span class="font-medium text-sm text-gray-900">{{ getUserName(document.user) }}</span>
						<span class="text-xs text-gray-500">{{ document.user?.organization_name || '—' }}</span>
					</div>
				</TableCell>
				<TableCell class="text-sm">{{ document.type || "—" }}</TableCell>
				<TableCell>
					<span class="inline-flex items-center gap-2 rounded-full bg-yellow-100 px-3 py-1 text-xs font-medium text-yellow-800">
						{{ document.deleteSignCount }}/2 підтверджень
					</span>
				</TableCell>
				<TableCell>
					<div class="flex flex-col gap-2">
						<div v-for="sign in document.deleteSigns" :key="sign.id" class="rounded-lg border border-gray-200 px-3 py-2">
							<div class="text-sm font-medium text-gray-900">{{ getSignerName(sign) }}</div>
							<div class="text-xs text-gray-500">Підтвердив: {{ formatDate(sign.createdAt) }}</div>
						</div>
						<div v-if="document.deleteSigns.length === 0" class="text-xs text-gray-500">
							Інформація відсутня
						</div>
					</div>
				</TableCell>
				<TableCell>
					<div class="flex flex-col gap-2">
						<Button variant="destructive" size="sm" class="w-full justify-center"
							:disabled="!canConfirm(document) || processingId === document.id"
							@click="confirmDeletion(document)">
							<template v-if="processingId === document.id && actionType === 'confirm'">
								<svg class="mr-1 h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
									<circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor"
										stroke-width="4"></circle>
									<path class="opacity-75" fill="currentColor"
										d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"></path>
								</svg>
							</template>
							Підтвердити
						</Button>
						<Button variant="secondary" size="sm" class="w-full justify-center"
							:disabled="!canRestore(document) || processingId === document.id"
							@click="restore(document)">
							<template v-if="processingId === document.id && actionType === 'restore'">
								<svg class="mr-1 h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
									<circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor"
										stroke-width="4"></circle>
									<path class="opacity-75" fill="currentColor"
										d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"></path>
								</svg>
							</template>
							Відновити
						</Button>
					</div>
				</TableCell>
			</TableRow>
		</TableBody>
	</Table>
</template>

<script setup lang="ts">
import { useToast } from "~/components/ui/toast";
import { useAdminStore } from "~/store/admin.store";
import { useUserStore, type Document, type DocumentDeleteSign, type User } from "~/store/user.store";

const props = defineProps<{
	documents: Document[];
}>();

const emit = defineEmits<{
	(e: "updated"): void;
}>();

const adminStore = useAdminStore();
const userStore = useUserStore();
const { toast } = useToast();

const processingId = ref<number | null>(null);
const actionType = ref<"confirm" | "restore" | null>(null);

const hasFullDeleteRights = computed(() => {
	const user = userStore.userGetter;
	return user.role === "admin" || user.role === "boogalter" || user.canDeleterDocuments;
});

const hasUserSigned = (document: Document) => {
	const currentId = userStore.userGetter.id;
	if (!currentId) return false;
	return document.deleteSigns.some((sign) => sign.userId === currentId);
};

const canConfirm = (document: Document) => {
	return hasFullDeleteRights.value || !hasUserSigned(document);
};

const canRestore = (document: Document) => {
	const currentId = userStore.userGetter.id;
	if (!currentId) return false;
	return (
		hasFullDeleteRights.value ||
		hasUserSigned(document) ||
		document.userId === currentId ||
		document.counterpartyId === currentId
	);
};

const confirmDeletion = async (document: Document) => {
	if (!canConfirm(document) || !userStore.userGetter.id) {
		return;
	}

	try {
		processingId.value = document.id;
		actionType.value = "confirm";
		await adminStore.deleteDocument(userStore.userGetter.id, document.id);
		emit("updated");
		toast({
			title: "Успіх",
			description: "Підтвердження видалення збережено",
		});
	} catch (error: any) {
		toast({
			title: "Помилка",
			description: error?.message || "Не вдалося підтвердити видалення",
			variant: "destructive",
		});
	} finally {
		processingId.value = null;
		actionType.value = null;
	}
};

const restore = async (document: Document) => {
	if (!canRestore(document) || !userStore.userGetter.id) {
		return;
	}

	try {
		processingId.value = document.id;
		actionType.value = "restore";
		await adminStore.restoreDocument(userStore.userGetter.id, document.id);
		emit("updated");
		toast({
			title: "Документ відновлено",
			description: "Запит на видалення скасовано",
		});
	} catch (error: any) {
		toast({
			title: "Помилка",
			description: error?.message || "Не вдалося відновити документ",
			variant: "destructive",
		});
	} finally {
		processingId.value = null;
		actionType.value = null;
	}
};

const getUserName = (user?: User) => {
	if (!user) return "—";
	return user.organization_name || user.name || user.email || `ID ${user.id}`;
};

const getSignerName = (sign: DocumentDeleteSign) => {
	if (sign.user) {
		return sign.user.organization_name || sign.user.name || sign.user.email || `ID ${sign.user.id}`;
	}
	return `ID ${sign.userId}`;
};

const formatDate = (date: string | Date) => {
	try {
		return new Date(date).toLocaleString("uk-UA");
	} catch {
		return date?.toString() ?? "";
	}
};
</script>

<style scoped>
.table-header {
	width: 100%;
	height: 80px;
}
</style>

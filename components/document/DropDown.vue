<template>
	<DropdownMenu>
		<DropdownMenuTrigger class="absolute inset-0 w-full h-full"></DropdownMenuTrigger>
		<DropdownMenuContent align="end">
			<DropdownMenuItem @select="openDocument">Показати документи</DropdownMenuItem>
			<DropdownMenuItem class="text-yellow-700" @select="handleSelect">
				<DocumentEditDialogWindow :invoice="invoice" />
			</DropdownMenuItem>
			<DropdownMenuItem v-if="canSignDocument" @select="handleSelectSign">
				<DocumentSignDialogWindow :documents="[invoice.id]" />
			</DropdownMenuItem>
			<DropdownMenuItem @select="handleSelectSign">
				<DocumentProtocol :invoice="invoice" />
			</DropdownMenuItem>

			<DropdownMenuItem
				v-if="canManageNotifications"
				@select="(e) => { e.preventDefault(); toggleNotifications(); }"
			>
				<span class="flex items-center gap-2">
					<component :is="notificationsOn ? BellOff : Bell" class="h-4 w-4" />
					{{ notificationsOn ? "Вимкнути сповіщення" : "Увімкнути сповіщення" }}
				</span>
			</DropdownMenuItem>
			<DropdownMenuItem v-else disabled>
				<span class="flex items-center gap-2 text-gray-500">
					<component :is="notificationsOn ? Bell : BellOff" class="h-4 w-4" />
					Сповіщення: {{ notificationsOn ? "увімкнено" : "вимкнено" }}
				</span>
			</DropdownMenuItem>

			<DropdownMenuItem class="text-red-600" @click="deleteDocument(invoice)">Видалити</DropdownMenuItem>
		</DropdownMenuContent>
	</DropdownMenu>
</template>

<script setup lang="ts">
import { useToast } from "~/components/ui/toast";
import { useAdminStore } from "~/store/admin.store";
import { useUserStore } from "~/store/user.store";
import {
	documentRequiresCounterpartySignature,
	documentRequiresSignature,
	getLatestStampedFilePath,
} from "~/lib/documents";
import { normalizeFileUrl } from "~/utils/fileUrl";
import { Bell, BellOff } from "lucide-vue-next";

const NOTIFICATION_MANAGER_ROLES = ["admin", "moderator", "lawyer", "boogalter"];

const props = defineProps({
	invoice: {
		type: Object,
		required: true,
	},
});

const adminStore = useAdminStore();
const userStore = useUserStore();
const { toast } = useToast();

const notificationsOn = ref<boolean>(props.invoice?.notificationsEnabled ?? true);
watch(
	() => props.invoice?.notificationsEnabled,
	(val) => {
		if (typeof val === "boolean") notificationsOn.value = val;
	},
);

const canManageNotifications = computed(() => NOTIFICATION_MANAGER_ROLES.includes(userStore.userRole));

const toggleNotifications = async () => {
	const next = !notificationsOn.value;
	try {
		const updated = await userStore.toggleDocumentNotifications(props.invoice.id, next);
		if (updated) {
			notificationsOn.value = updated.notificationsEnabled;
			if (props.invoice && typeof props.invoice === "object") {
				props.invoice.notificationsEnabled = updated.notificationsEnabled;
			}
			toast({
				title: "Готово",
				description: updated.notificationsEnabled
					? "Сповіщення для документа увімкнено"
					: "Сповіщення для документа вимкнено",
			});
		}
	} catch (error: any) {
		toast({
			title: "Помилка",
			description: error?.message || "Не вдалося змінити сповіщення",
			variant: "destructive",
		});
	}
};

const canSignDocument = computed(() => {
	if (!documentRequiresSignature(props.invoice?.type)) {
		return false;
	}

	if (documentRequiresCounterpartySignature(props.invoice?.type)) {
		return userStore.userRole === "counterparty";
	}

	return true;
});


const documentView = useState("isDocumentView");
const documentUrl = useState("documentUrl");
const openDocument = (event: Event) => {
	if (props.invoice.status === "Підписано") {
		documentUrl.value = normalizeFileUrl(getLatestStampedFilePath(props.invoice.Signature) || props.invoice.filePath);
	} else {
		documentUrl.value = normalizeFileUrl(props.invoice.filePath);
	}
	documentView.value = true;
};

const handleSelect = (event: Event) => {
	event.preventDefault();
};

const handleSelectSign = (event: Event) => {
	event.preventDefault();
};

const deleteDocument = async (invoice: any) => {
	try {
		const reponse = await adminStore.deleteDocument(userStore.userGetter.id, invoice.id);
		toast({
			title: "Успех",
			description: reponse,
			variant: "default",
		});
	}
	catch (error: any) {
		console.log(error);

		if (error.message) {
			toast({
				title: "Помилка",
				description: error.message,
				variant: "destructive",
			});
		} else {
			toast({
				title: "Невідома помилка",
				description: "Спробуйте пізніше",
				variant: "destructive",
			});
		}
	}
};
</script>

<style scoped></style>

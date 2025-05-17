<template>
	<DropdownMenu>
		<DropdownMenuTrigger class="absolute inset-0 w-full h-full"></DropdownMenuTrigger>
		<DropdownMenuContent align="end">
			<DropdownMenuItem @select="openDocument">Показать документы</DropdownMenuItem>
			<DropdownMenuItem class="text-yellow-700" @select="handleSelect">
				<DocumentEditDialogWindow :invoice="invoice" />
			</DropdownMenuItem>
			<DropdownMenuItem @select="handleSelectSign">
				<DocumentSignDialogWindow />
			</DropdownMenuItem>
			<!-- <DropdownMenuItem class="text-blue-600" @click="redirectToESign()">Перейти на подпись</DropdownMenuItem> -->
			<DropdownMenuItem class="text-red-600" @click="deleteDocument(invoice)">Удалить</DropdownMenuItem>
		</DropdownMenuContent>
	</DropdownMenu>
</template>

<script setup lang="ts">
import { useToast } from "~/components/ui/toast";
import { useAdminStore } from "~/store/admin.store";
import { useUserStore } from "~/store/user.store";

const props = defineProps({
	invoice: {
		type: Object,
		required: true,
	},
});

const router = useRouter();
const adminStore = useAdminStore();
const userStore = useUserStore();
const { toast } = useToast();


const documentView = useState("isDocumentView");
const documentUrl = useState("documentUrl");
const openDocument = (event: Event) => {
	documentUrl.value = props.invoice.filePath;
	documentView.value = true;
};

const handleSelect = (event: Event) => {
	event.preventDefault();
};

const handleSelectSign = (event: Event) => {
	event.preventDefault();
};

// const redirectToESign = () => {
// 	const state = crypto.randomUUID();
// 	const params = new URLSearchParams({
// 		response_type: 'code',
// 		client_id: '44e1a3fc703ac7ed0a40954b4d93646c',
// 		auth_type: 'dig_sign',
// 		state,
// 		redirect_uri: 'https://agroedoc.com'
// 	})
// 	console.log(params);
// 	window.location.href = `https://id.gov.ua/?${params.toString()}`
// }

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
				title: "Ошибка",
				description: error.message,
				variant: "destructive",
			});
		} else {
			toast({
				title: "Неизвестная ошибка",
				description: "Попробуйте позже",
				variant: "destructive",
			});
		}
	}
};
</script>

<style scoped></style>

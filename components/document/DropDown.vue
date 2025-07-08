<template>
	<DropdownMenu>
		<DropdownMenuTrigger class="absolute inset-0 w-full h-full"></DropdownMenuTrigger>
		<DropdownMenuContent align="end">
			<DropdownMenuItem @select="openDocument">Показать документы</DropdownMenuItem>
			<DropdownMenuItem class="text-yellow-700" @select="handleSelect">
				<DocumentEditDialogWindow :invoice="invoice" />
			</DropdownMenuItem>
			<DropdownMenuItem @select="handleSelectSign" v-if="invoice.status !== 'Підписано'">
				<DocumentSignDialogWindow />
			</DropdownMenuItem>
			<DropdownMenuItem @select="handleSelectSign">
				<DocumentDownload :invoice="invoice" />
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
	const currentQuery = { ...router.currentRoute.value.query };
	router.push({
		query: {
			...currentQuery,
			documentSign: props.invoice.id
		}
	});

	// const filePath = props.invoice.filePath;
	// if (!filePath) return;

	// const link = document.createElement('a');
	// link.href = filePath;
	// link.download = filePath.split('/').pop() || 'document.pdf';
	// document.body.appendChild(link);
	// link.click();
	// document.body.removeChild(link);
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

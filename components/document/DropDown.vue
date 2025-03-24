<template>
	<DropdownMenu>
		<DropdownMenuTrigger class="absolute inset-0 w-full h-full"></DropdownMenuTrigger>
		<DropdownMenuContent align="end">
			<DropdownMenuItem @select="openDocument">Показать документы</DropdownMenuItem>
			<DropdownMenuItem class="text-yellow-700" @select="handleSelect">
				<DocumentEditDialogWindow :invoice="invoice" />
			</DropdownMenuItem>
			<DropdownMenuItem class="text-blue-600">Подписать</DropdownMenuItem>
			<DropdownMenuItem class="text-red-600" @click="deleteDocument(invoice)">Удалить</DropdownMenuItem>
		</DropdownMenuContent>
	</DropdownMenu>
</template>

<script setup lang="ts">
	import { useAdminStore } from "~/store/admin.store";

	const props = defineProps({
		invoice: {
			type: Object,
			required: true,
		},
	});

	const router = useRouter();
	const adminStore = useAdminStore();

	const documentView = useState("isDocumentView");
	const documentUrl = useState("documentUrl");
	const openDocument = (event: Event) => {
		documentUrl.value = props.invoice.filePath;
		documentView.value = true;
	};

	const handleSelect = (event: Event) => {
		event.preventDefault();
	};

	const deleteDocument = async (invoice: any) => {
		await adminStore.deleteDocument(parseInt(invoice.id));
	};
</script>

<style scoped></style>

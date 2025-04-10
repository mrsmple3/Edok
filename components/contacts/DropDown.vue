<template>
	<DropdownMenu>
		<DropdownMenuTrigger class="absolute inset-0 w-full h-full"></DropdownMenuTrigger>
		<DropdownMenuContent align="end">
			<DropdownMenuItem @click="openDocument(invoice)">Показать документы</DropdownMenuItem>
			<DropdownMenuItem @click="openLead(invoice)">Показать угоды</DropdownMenuItem>
			<DropdownMenuItem class="text-red-600" @click="deleteContact(invoice)">Удалить</DropdownMenuItem>
		</DropdownMenuContent>
	</DropdownMenu>
</template>

<script setup lang="ts">
import { useAdminStore } from "~/store/admin.store";

defineProps({
	invoice: {
		type: Object,
		required: true,
	},
});

const router = useRouter();
const adminStore = useAdminStore();

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
</script>

<style scoped></style>

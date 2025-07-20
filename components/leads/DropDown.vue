<template>
	<DropdownMenu>
		<DropdownMenuTrigger class="absolute inset-0 w-full h-full"></DropdownMenuTrigger>
		<DropdownMenuContent align="end">
			<DropdownMenuItem @click="openDocument(invoice)">Показати документи</DropdownMenuItem>
			<DropdownMenuItem class="text-yellow-700" @select="handleSelect">
				<LeadsEditDialogWindow :invoice="invoice" />
			</DropdownMenuItem>
			<DropdownMenuItem class="text-red-600" @click="deleteLead(invoice)">Видалити</DropdownMenuItem>
		</DropdownMenuContent>
	</DropdownMenu>
</template>

<script setup lang="ts">
import type { Lead } from "@prisma/client";
import { useAdminStore } from "~/store/admin.store";

defineProps({
	invoice: {
		type: Object as PropType<Lead>,
		required: true,
	},
});

const router = useRouter();
const adminStore = useAdminStore();

const openDocument = async (invoice: any) => {
	await router.push({ path: "/leads/docs/", query: { id: invoice.id } }).then(async () => {
		await adminStore.getDocumentsByLeadId(invoice.id);
	});
};

const handleSelect = (event: Event) => {
	event.preventDefault();
};

const deleteLead = async (invoice: any) => {
	await adminStore.deleteLead(parseInt(invoice.id));
};
</script>

<style scoped></style>

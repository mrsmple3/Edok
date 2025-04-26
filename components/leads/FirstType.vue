<template>
	<Table class="w-full">
		<TableHeader class="w-full h-[80px]">
			<TableRow class="border-none">
				<TableHead class="t-head"> Название документа </TableHead>
				<TableHead class="t-head">Тип сделки </TableHead>
				<TableHead class="t-head">Документов </TableHead>
				<TableHead class="t-head">Модераторы </TableHead>
				<TableHead class="t-head">Дата создания </TableHead>
				<TableHead class="t-head">Контрагенты </TableHead>
				<TableHead class="t-head">Автор</TableHead>
			</TableRow>
		</TableHeader>
		<TableBody class="w-full">
			<LeadsTable v-for="invoice in invoices" :key="invoice.id" :invoice="invoice" />
		</TableBody>
	</Table>
</template>

<script lang="ts" setup>
import { type Lead } from "~/store/user.store";

defineProps({
	invoices: {
		type: Array as PropType<Lead[]>,
		required: true,
	},
});
</script>

<style lang="scss" scoped></style>

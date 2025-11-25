<template>
	<Table class="w-full">
		<TableHeader class="w-full h-[80px]">
			<TableRow class="border-none">
				<TableHead class="t-head"> Назва документа </TableHead>
				<TableHead class="t-head">Тип угоди </TableHead>
				<TableHead class="t-head">Документів </TableHead>
				<TableHead class="t-head">Модератори </TableHead>
				<TableHead class="t-head">Дата створення </TableHead>
				<TableHead class="t-head">Контрагенти </TableHead>
				<TableHead class="t-head">Автор</TableHead>
			</TableRow>
		</TableHeader>
		<TableBody class="w-full">
			<LeadsTable v-for="invoice in props.invoices" :key="invoice.id" :invoice="invoice" />
		</TableBody>
	</Table>
</template>

<script lang="ts" setup>
import { type Lead } from "~/store/user.store";

const props = defineProps({
	invoices: {
		type: Array as PropType<Lead[]>,
		required: true,
	},
});
</script>

<style lang="scss" scoped></style>

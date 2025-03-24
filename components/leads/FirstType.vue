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
			<TableRow v-for="(invoice, index) in invoices" :key="invoice.id" class="relative hover:bg-[#2d9cdb]/20">
				<!--        @click="chatState = true"-->
				<TableCell class="flex-center justify-start gap-[20px] t-cell">
					<img alt="doc" class="w-[33px] h-[45px]" src="/icons/lead-doc.svg" />
					<div>
						{{ invoice.name.length > 23 ? invoice.name.substring(0, 20) + "..." : invoice.name }}
					</div>
				</TableCell>
				<TableCell class="w-[114px] t-cell">{{ invoice.type }} </TableCell>
				<TableCell class="t-cell">{{ invoice.documents && invoice.documents.length }}</TableCell>
				<TableCell class="t-cell">{{ invoice.moderators ? invoice.moderators.name : "Не выбрано" }} </TableCell>
				<TableCell class="t-cell">{{ new Date(invoice.createdAt).toLocaleDateString("ru-RU") }}</TableCell>
				<TableCell class="t-cell">{{ invoice.counterparty ? invoice.counterparty.name : "Не выбран" }} </TableCell>
				<TableCell class="t-cell">{{ invoice.author.email }}</TableCell>
				<LeadsDropDown :invoice="invoice" />
			</TableRow>
		</TableBody>
	</Table>
</template>

<script lang="ts" setup>
	import { useCounterpartyStore } from "~/store/counterparty.store";
	import { type Document, type User, type Lead, useUserStore } from "~/store/user.store";

	defineProps({
		invoices: {
			type: Array as PropType<Lead[]>,
			required: true,
		},
	});

	const counterpartyStore = useCounterpartyStore();
	const userStore = useUserStore();
	const chatState = useState("isChat");
	const router = useRouter();
	const route = useRoute();
</script>

<style lang="scss" scoped></style>

<template>
	<Table class="w-full">
		<TableHeader class="w-full h-[80px]">
			<TableRow class="border-none">
				<TableHead class="t-head"> Название документа </TableHead>
				<TableHead class="t-head">Тип сделки </TableHead>
				<TableHead class="t-head">Количество ст... </TableHead>
				<TableHead class="t-head">Документов </TableHead>
				<TableHead class="t-head">Модераторы </TableHead>
				<TableHead class="t-head">Дата создания </TableHead>
				<TableHead class="t-head">Контрагенты </TableHead>
				<TableHead class="t-head">Автор</TableHead>
			</TableRow>
		</TableHeader>
		<TableBody class="w-full">
			<TableRow v-for="(invoice, index) in invoices" :key="invoice.id" class="hover:bg-[#2d9cdb]/20" @click="openDocument(invoice)">
				<!--        @click="chatState = true"-->
				<TableCell class="flex-center justify-start gap-[20px] t-cell">
					<img alt="doc" class="w-[33px] h-[45px]" src="/icons/lead-doc.svg" />
					<div v-if="invoice.documents.length > 0">
						{{ invoice.documents[0].title.length > 23 ? invoice.documents[0].title.substring(0, 20) + "..." : invoice.documents[0].title }}
					</div>
				</TableCell>
				<TableCell class="w-[114px] t-cell">{{ invoice.type }} </TableCell>
				<TableCell class="w-[20px] t-cell">{{ invoice.quantity }} </TableCell>
				<TableCell class="t-cell">{{ invoice.quantity }}</TableCell>
				<TableCell class="t-cell">{{ invoice.moderatorsId }} </TableCell>
				<TableCell class="t-cell">{{ invoice.createdAt }}</TableCell>
				<TableCell class="t-cell">{{ invoice.contragentId }} </TableCell>
				<TableCell class="t-cell">{{ invoice.author.email }}</TableCell>
			</TableRow>
		</TableBody>
	</Table>
</template>

<script lang="ts" setup>
	import { useCounterpartyStore } from "~/store/counterparty.store";
	import type { Document, User, Lead } from "~/store/user.store";

	defineProps({
		invoices: {
			type: Array as PropType<Lead[]>,
			required: true,
		},
	});

	const counterpartyStore = useCounterpartyStore();
	const chatState = useState("isChat");
	const router = useRouter();
	const route = useRoute();

	const openDocument = async (invoice: any) => {
		await router.push({ path: "/docs/", query: { id: invoice.id } }).then(async () => {
			await counterpartyStore.getDocumentsByLeadId(invoice.id);
		});
	};
</script>

<style lang="scss" scoped></style>

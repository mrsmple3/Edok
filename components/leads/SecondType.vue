<template>
	<Table class="w-full">
		<TableHeader class="w-full h-[80px]">
			<TableRow class="border-none">
				<TableHead class="t-head">Название документа</TableHead>
				<TableHead class="t-head">Загружено</TableHead>
				<TableHead class="t-head">Состояние</TableHead>
				<TableHead class="t-head">Согласующие</TableHead>
			</TableRow>
		</TableHeader>
		<TableBody class="w-full">
			<TableRow v-for="(invoice, index) in invoices" :key="index" class="hover:bg-[#2d9cdb]/20">
				<TableCell class="flex-center justify-start gap-[20px] t-cell">
					<img alt="doc" class="w-[33px] h-[45px]" src="/icons/lead-doc.svg" />
					<div class="w-max flex flex-col items-start">
						<span v-if="invoice.documents.length > 0" class="text-[#494949] text-[15px] font-medium font-['Barlow']">{{
							invoice.documents[0].title.length > 23 ? invoice.documents[0].title.substring(0, 33) + "..." : invoice.documents[0].title
						}}</span>
						<span class="text-[#898989] text-[15px] font-['Barlow']">Для информации Подтверждающие</span>
						<span class="text-[#404040] text-[11px] font-['Barlow']">Шевченко Людмила Николаевна</span>
					</div>
				</TableCell>
				<TableCell class="t-cell">{{ invoice.createdAt }}</TableCell>
				<TableCell
					:class="{
						'text-[#494949]': invoice.status === 'Информационный',
						'text-[#00B074]': invoice.status === 'На підписанні контрагентом',
						'text-[#FF5B5B]': invoice.status === 'Відхилено контрагентом',
					}"
					class="w-[144px] t-cell"
					>{{ invoice.status }}
				</TableCell>
				<TableCell class="t-cell">
					<div
						class="w-[49.59px] h-[50px] justify-self-center bg-[#2d9cdb]/20 flex items-center justify-center rounded-full text-[#2d9cdb] text-[25px] font-bold font-['Barlow']">
						1
					</div>
				</TableCell>
			</TableRow>
		</TableBody>
	</Table>
</template>

<script lang="ts" setup>
	import type { Lead } from "~/store/user.store";

	defineProps({
		invoices: {
			type: Array as PropType<Lead[]>,
			required: true,
		},
	});
</script>

<style lang="scss" scoped></style>

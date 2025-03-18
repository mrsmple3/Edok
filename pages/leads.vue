<!-- TODO: Done the lead page  -->
<template>
	<div class="page-container">
		<div class="w-full flex-center justify-between mb-[18px]">
			<div class="flex-center">
				<h2 class="page__title mr-[32px]">Угоди</h2>

				<button
					class="submenu-parent relative flex-center gap-[11px] rounded-[14px] border border-[#2d9cdb] py-2 px-7 text-[#2d9cdb] text-[18px] font-bold font-['Barlow'] mr-[24px] hover:active">
					<img alt="plus" class="w-[19px] h-[19px]" src="/icons/plus-blue.svg" />
					Добавить соглашение
					<div class="submenu">
						<span>Добавить спецификацию</span>
						<span>Добавить счет</span>
						<span>Добавить накладную</span>
						<span>Добавить подтверждающие документы</span>
					</div>
				</button>

				<div class="flex-center gap-6">
					<img alt="list" class="max-w-[24px] max-h-[24px] min-h-max min-w-max cursor-pointer" src="/icons/leads-icon-list-1.svg" />
					<img alt="list" class="max-w-[24px] max-h-[24px] min-h-max min-w-max cursor-pointer" src="/icons/leads-icon-list-2.svg" />
					<img alt="list" class="max-w-[24px] max-h-[24px] min-h-max min-w-max cursor-pointer" src="/icons/leads-icon-list-3.svg" />
					<img alt="list" class="max-w-[24px] max-h-[24px] min-h-max min-w-max cursor-pointer" src="/icons/leads-icon-list-4.svg" />
					<img alt="list" class="max-w-[24px] max-h-[24px] min-h-max min-w-max cursor-pointer" src="/icons/leads-icon-list-5.svg" />
				</div>
			</div>

			<div class="flex-center gap-[15px]">
				<Badge class="w-12 h-12 bg-[#2d9cdb]/20 rounded-[15px] hover:bg-[#2d9cdb]/30">
					<img alt="filter" src="/icons/filter.svg" />
				</Badge>
				<Badge class="w-12 h-12 bg-[#2d9cdb]/20 rounded-[15px] hover:bg-[#2d9cdb]/30">
					<img alt="filter" src="/icons/restar.svg" />
				</Badge>
			</div>
		</div>
		<div class="flex-center gap-[5px] mb-[26px]">
			<NuxtLink class="breadcrumbs" to="">Угоди</NuxtLink>
		</div>
		<div class="page__block pt-[40px] pb-[40px] px-[42px]">
			<LeadsFirstType v-if="!chatState" :invoices="userStore.leadsGetter" />
			<LeadsSecondType v-else :invoices="userStore.leadsGetter" />
		</div>
	</div>
</template>

<script lang="ts" setup>
	import { useUserStore } from "~/store/user.store";

	definePageMeta({
		layout: "page",
	});
	const chatState = useState("isChat");

	const invoices = [
		{
			name: "2100359852 Commodity - Corn - DAP ЧЕРНОМОРСКАЯ - ХЮРРЕМ ООО (38852547)",
			type: "Двухстороннее соглашение",
			quantity: "2",
			docs: "57",
			moderators: "Васильчук",
			data: "06.12.2024",
			contragents: 'ООО "АО Каргилл""',
			author: 'ООО "АО Каргилл"',
			status: "Информационный",
			concordants: "1",
		},
		{
			name: "2100359852 Commodity - Corn - DAP ЧЕРНОМОРСКАЯ - ХЮРРЕМ ООО (38852547)",
			type: "Двухстороннее соглашение",
			quantity: "2",
			docs: "57",
			moderators: "Васильчук",
			data: "06.12.2024",
			contragents: 'ООО "АО Каргилл""',
			author: 'ООО "АО Каргилл"',
			status: "На підписанні контрагентом",
			concordants: "1",
		},
		{
			name: "2100359852 Commodity - Corn - DAP ЧЕРНОМОРСКАЯ - ХЮРРЕМ ООО (38852547)",
			type: "Двухстороннее соглашение",
			quantity: "2",
			docs: "57",
			moderators: "Васильчук",
			data: "06.12.2024",
			contragents: 'ООО "АО Каргилл""',
			author: 'ООО "АО Каргилл"',
			status: "Відхилено контрагентом",
			concordants: "1",
		},
	];

	const userStore = useUserStore();

	onBeforeMount(() => {
		callOnce(async () => {
			await userStore.getLeads(userStore.userGetter.id);
		});
	});
</script>

<style lang="scss" scoped></style>

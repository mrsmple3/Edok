<template>
	<div class="page-container">
		<div class="w-full flex-center justify-between mb-[18px]">
			<div class="flex-center">
				<h2 class="page__title mr-[32px]">Документи</h2>

				<button
					class="submenu-parent relative flex-center gap-[11px] rounded-[14px] border border-[#2d9cdb] py-2 px-7 text-[#2d9cdb] text-[18px] font-bold font-['Barlow'] mr-[24px] hover:active">
					<img alt="plus" class="w-[19px] h-[19px]" src="/icons/plus-blue.svg" />
					Добавить соглашение
					<div class="submenu">
						<div class="cursor-pointer">
							<label for="specification">Добавить спецификацию</label>
							<input id="specification" type="file" accept="application/pdf" class="hidden"
								@change="(event) => handleFileUpload(event, 'Спецификация')" />
						</div>
						<div class="cursor-pointer">
							<label for="check">Добавить счет</label>
							<input id="check" type="file" accept="application/pdf" class="hidden"
								@change="(event) => handleFileUpload(event, 'Счет')" />
						</div>
						<div class="cursor-pointer">
							<label for="invoice">Добавить накладную</label>
							<input id="invoice" type="file" accept="application/pdf" class="hidden"
								@change="(event) => handleFileUpload(event, 'Накладная')" />
						</div>
						<div class="cursor-pointer">
							<label for="confirming">Добавить подтверждающие документы</label>
							<input id="confirming" type="file" accept="application/pdf" class="hidden"
								@change="(event) => handleFileUpload(event, 'Подтверждающий документ')" />
						</div>
					</div>
				</button>

				<!-- <div class="flex-center gap-6">
					<img alt="list" class="max-w-[24px] max-h-[24px] min-h-max min-w-max cursor-pointer" src="/icons/leads-icon-list-1.svg" />
					<img alt="list" class="max-w-[24px] max-h-[24px] min-h-max min-w-max cursor-pointer" src="/icons/leads-icon-list-2.svg" />
					<img alt="list" class="max-w-[24px] max-h-[24px] min-h-max min-w-max cursor-pointer" src="/icons/leads-icon-list-3.svg" />
					<img alt="list" class="max-w-[24px] max-h-[24px] min-h-max min-w-max cursor-pointer" src="/icons/leads-icon-list-4.svg" />
					<img alt="list" class="max-w-[24px] max-h-[24px] min-h-max min-w-max cursor-pointer" src="/icons/leads-icon-list-5.svg" />
				</div> -->
			</div>

			<div class="flex-center gap-[15px]">
				<Badge class="w-12 h-12 bg-[#2d9cdb]/20 rounded-[15px] hover:bg-[#2d9cdb]/30">
					<img alt="filter" src="/icons/filter.svg" />
				</Badge>
				<RefreshData :refreshFunction="async () => await adminStore.getDocumentsByLeadId(route.query.id)" />
			</div>
		</div>
		<div class="flex-center gap-[5px] mb-[26px]">
			<NuxtLink class="breadcrumbs" to="">Документи</NuxtLink>
		</div>
		<div class="page__block pt-[40px] px-[42px]">
			<Table v-if="adminStore.$state.documents && adminStore.$state.documents.length > 0" class="w-full">
				<TableHeader class="w-full h-[80px]">
					<TableRow class="border-none">
						<TableHead class="t-head">Название документа</TableHead>
						<TableHead class="t-head">Угода</TableHead>
						<TableHead class="t-head">Контрагент</TableHead>
						<TableHead class="t-head">Загружено</TableHead>
						<TableHead class="t-head">Состояние</TableHead>
						<TableHead class="t-head">Согласующие</TableHead>
					</TableRow>
				</TableHeader>
				<DocumentViewer v-if="documentView" :documentUrl="documentUrl" />
				<TableBody class="w-full">
					<TableRow v-for="(invoice, index) in adminStore.$state.documents" :key="index"
						class="relative hover:bg-[#2d9cdb]/20">
						<TableCell class="w-max flex-center gap-[20px]">
							<img alt="doc" class="w-[33px] h-[45px]" src="/icons/lead-doc.svg" />
							<div class="w-max flex flex-col items-start">
								<span class="text-[#494949] text-[15px] font-medium font-['Barlow']">{{ invoice.title.length > 23 ?
									invoice.title.substring(0, 33) + "..." : invoice.title }}</span>
								<span class="text-[#898989] text-[15px] font-['Barlow']">{{ invoice.type }}</span>
								<span class="text-[#404040] text-[11px] font-['Barlow']">{{ invoice.user.name }}</span>
							</div>
						</TableCell>
						<TableCell class="t-cell">{{ invoice.lead ? invoice.lead.name : "Еще не создано" }}</TableCell>
						<TableCell class="t-cell">{{ getInfoCounterparty(invoice) }}</TableCell>
						<TableCell class="t-cell">{{ new Date(invoice.createdAt).toLocaleDateString("ru-RU") }}</TableCell>
						<TableCell class="t-cell">{{ invoice.status }}</TableCell>
						<TableCell class="t-cell">
							<div
								class="w-[49.59px] h-[50px] justify-self-center bg-[#2d9cdb]/20 flex items-center justify-center rounded-full text-[#2d9cdb] text-[25px] font-bold font-['Barlow']">
								1</div>
						</TableCell>
						<DocumentDropDown :invoice="invoice" />
					</TableRow>
				</TableBody>
			</Table>
			<NotFoundDocument v-else />
		</div>
	</div>
</template>

<script lang="ts" setup>
import { useToast } from "~/components/ui/toast"
import { useUserStore } from "../store/user.store"
import { useAdminStore } from "~/store/admin.store"

definePageMeta({
	layout: "page",
})

const route = useRoute()
const userStore = useUserStore()
const adminStore = useAdminStore()

const documentView = useState("isDocumentView", () => false)
const documentUrl = useState("documentUrl", () => "")

const selectedFile = ref<File | null>(null); // Хранение выбранного файла

const getDocument = async () => {
	if (userStore.userRole !== "counterparty" && route.query.id === undefined) {
		await adminStore.getAllDocuments();
	} else if (route.query.id) {
		await adminStore.getDocumentsByLeadId(route.query.id);
	} else {
		await adminStore.getDocumentsByUserId(userStore.userGetter.id);
	}
}

onBeforeMount(async () => {
	watch(
		() => [userStore.isAuthInitialized, route.fullPath],
		async (newVal, routeFull) => {
			if (newVal) {
				await getDocument();
			}
		},
		{
			immediate: true,
		}
	)
});

const handleFileUpload = (event: Event, documentType: string) => {
	const target = event.target as HTMLInputElement;
	if (target.files && target.files[0]) {
		selectedFile.value = target.files[0];

		// Здесь можно вызвать метод для загрузки документа
		uploadDocument(selectedFile.value, documentType);
	}
};

const uploadDocument = async (file: File, documentType: string) => {
	try {
		const document = await adminStore.createDocument(
			{
				title: file.name,
				userId: userStore.userGetter.id,
				counterpartyId: userStore.userGetter.id,
				type: documentType,
				status: "Информационный",
			},
			file
		);
	} catch (error: any) {
		const { toast } = useToast();
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

const getInfoCounterparty = (invoice: any) => {
	if (invoice.counterparty) {
		if (invoice.counterparty.name) {
			return invoice.counterparty.name
		} else if (invoice.counterparty.email) {
			return invoice.counterparty.email
		} else if (invoice.counterparty.phone) {
			return invoice.counterparty.phone
		}
	} else {
		return "Не выбран"
	}
}
</script>

<style lang="scss" scoped></style>

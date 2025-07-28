<template>
	<div class="page-container">
		<div class="w-full flex-center justify-between mb-[18px]">
			<div class="flex-center">
				<h2 class="page__title mr-[32px]">Документи</h2>

				<button v-if="userStore.userRole === 'counterparty'"
					class="submenu-parent relative flex-center gap-[11px] rounded-[14px] border border-[#2d9cdb] py-2 px-7 text-[#2d9cdb] text-[18px] font-bold font-['Barlow'] mr-[24px] hover:active">
					<img alt="plus" class="w-[19px] h-[19px]" src="/icons/plus-blue.svg" />
					Додати документ
					<div class="submenu">
						<div class="cursor-pointer">
							<label for="contract">Договір </label>
							<input id="contract" type="file" accept="application/pdf" class="hidden"
								@change="(event) => handleFileUpload(event, 'Договір')" />
						</div>
						<div class="cursor-pointer">
							<label for="additional-agreement">Додаткова угода </label>
							<input id="additional-agreement" type="file" accept="application/pdf" class="hidden"
								@change="(event) => handleFileUpload(event, 'Додаткова угода')" />
						</div>
						<div class="cursor-pointer">
							<label for="specification">Специфікація </label>
							<input id="specification" type="file" accept="application/pdf" class="hidden"
								@change="(event) => handleFileUpload(event, 'Специфікація')" />
						</div>
						<div class="cursor-pointer">
							<label for="invoice">Рахунок</label>
							<input id="invoice" type="file" accept="application/pdf" class="hidden"
								@change="(event) => handleFileUpload(event, 'Рахунок')" />
						</div>
						<div class="cursor-pointer">
							<label for="delivery-note">Видаткова накладна </label>
							<input id="delivery-note" type="file" accept="application/pdf" class="hidden"
								@change="(event) => handleFileUpload(event, 'Видаткова накладна')" />
						</div>
						<div class="cursor-pointer">
							<label for="ttn">Товарно-транспортна накладна </label>
							<input id="ttn" type="file" accept="application/pdf" class="hidden"
								@change="(event) => handleFileUpload(event, 'Товарно-транспортна накладна')" />
						</div>
						<div class="cursor-pointer">
							<label for="confirming">Підтверджуючі</label>
							<input id="confirming" type="file" accept="application/pdf" class="hidden"
								@change="(event) => handleFileUpload(event, 'Підтверджуючі')" />
						</div>
					</div>
				</button>
			</div>

			<div class="flex-center gap-[15px]">
				<DocumentFilter :counterparties="counterparties" />
				<RefreshData :refreshFunction="async () => await getDocument()" />
			</div>
		</div>
		<div class="flex-center gap-[5px] mb-[26px]">
			<NuxtLink class="breadcrumbs" to="">Документи</NuxtLink>
		</div>
		<div class="page__block py-[30px] px-[42px]">
			<DocumentComponent v-if="adminStore.$state.filteredDocuments && adminStore.$state.filteredDocuments.length > 0"
				:paginatedDocuments="paginatedDocuments" />
			<NotFoundDocument v-else />
		</div>
		<Pagination class="pagination-class" v-slot="{ page }" :items-per-page="itemsPerPage"
			:total="adminStore.$state.filteredDocuments.length" :sibling-count="1" show-edges :default-page="1"
			@update:page="(newPage) => (currentPage = newPage)">
			<PaginationList v-slot="{ items }" class="flex items-center gap-1">
				<PaginationFirst />
				<PaginationPrev />

				<template v-for="(item, index) in items">
					<PaginationListItem v-if="item.type === 'page'" :key="index" :value="item.value" as-child>
						<Button class="w-9 h-9 p-0" :variant="item.value === page ? 'default' : 'outline'">
							{{ item.value }}
						</Button>
					</PaginationListItem>
					<PaginationEllipsis v-else :key="item.type" :index="index" />
				</template>

				<PaginationNext />
				<PaginationLast />
			</PaginationList>
		</Pagination>
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

const counterparties = ref();

const selectedFile = ref<File | null>(null); // Хранение выбранного файла

const getDocument = async () => {
	if (userStore.userRole !== "counterparty" && route.query.id === undefined) {
		await adminStore.getAllDocuments();
	} else if (route.query.id) {
		await adminStore.getDocumentsByLeadId(route.query.id);
	} else {
		await adminStore.getDocumentsByUserId(userStore.userGetter.id);
	}
	adminStore.$state.filteredDocuments = adminStore.$state.documents;
}

const currentPage = ref(1); // Текущая страница
const itemsPerPage = 6; // Количество элементов на странице

// Получаем данные для текущей страницы
const paginatedDocuments = computed(() => {
	const start = (currentPage.value - 1) * itemsPerPage;
	const end = start + itemsPerPage;
	return adminStore.$state.filteredDocuments.slice(start, end);
});

// Общее количество страниц
const totalPages = computed(() => {
	return Math.ceil(adminStore.$state.documents.length / itemsPerPage);
});

onBeforeMount(async () => {
	watch(
		() => [userStore.isAuthInitialized, route.fullPath],
		async (newVal, routeFull) => {
			if (newVal) {
				await getDocument();
				await userStore.getCounterparties().then(() => {
					counterparties.value = userStore.$state.counterparties.map((counterparty) => ({
						value: counterparty.id,
						label: counterparty.organization_name,
					}));
				})
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
				counterpartyId: userStore.userGetter ? userStore.userGetter.id : null,
				type: documentType,
				content: "Інформаційний",
				status: 'В очікуванні'
			},
			file
		);
	} catch (error: any) {
		const { toast } = useToast();
		console.log(error);

		if (error.message) {
			toast({
				title: "Помилка",
				description: error.message,
				variant: "destructive",
			});
		} else {
			toast({
				title: "Невідома помилка",
				description: "Спробуйте пізніше",
				variant: "destructive",
			});
		}
	}
};
</script>

<style lang="scss" scoped></style>

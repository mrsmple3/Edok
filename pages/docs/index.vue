<template>
	<div class="page-container">
		<div class="w-full flex-center justify-between m-b-18">
			<div class="flex-center">
				<h2 class="page__title m-r-32">Документи</h2>

				<DocumentSignDialogWindow :documents="selectedDocumentIds" trigger-label="Підписати обрані"
					:trigger-class="bulkSignButtonClass" :disabled="selectedDocumentIds.length === 0" />

				<!-- <button v-if="userStore.userRole === 'counterparty'"
					class="submenu-parent relative flex-center page-button hover:active">
					<img alt="plus" class="page-icon" src="/icons/plus-blue.svg" />
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
						<div class="cursor-pointer">
              <label for="revaluation">Акт переоцінки</label>
              <input id="revaluation" type="file" accept="application/pdf" class="hidden"
                @change="(event) => handleFileUpload(event, 'Акт переоцінки')" />
            </div>
            <div class="cursor-pointer">
              <label for="animal">АКТ ЗВІРКИ</label>
              <input id="animal" type="file" accept="application/pdf" class="hidden"
                @change="(event) => handleFileUpload(event, 'АКТ ЗВІРКИ')" />
            </div>
					</div>
				</button> -->
			</div>

			<div class="flex-center gap-15">
				<DocumentFilter :counterparties="counterparties" />
				<NuxtLink class="page-button flex-center gap-2 hover:active" to="/docs/trash">
					<svg class="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
						<path stroke-linecap="round" stroke-linejoin="round"
							d="M9 3h6m-9 4h12m-10 0v12a1 1 0 001 1h6a1 1 0 001-1V7" />
						<path stroke-linecap="round" stroke-linejoin="round" d="M10 11v6m4-6v6" />
					</svg>
					Корзина
				</NuxtLink>
				<RefreshData :refreshFunction="async () => await getDocument()" />
			</div>
		</div>
		<div class="flex-center gap-5 m-b-26">
			<NuxtLink class="breadcrumbs" to="/docs">Документи</NuxtLink>
		</div>
		<div class="page__block p-y-30 p-x-42">
			<DocumentComponent v-if="adminStore.$state.filteredDocuments && adminStore.$state.filteredDocuments.length > 0"
				:paginatedDocuments="paginatedDocuments" />
			<NotFoundDocument v-else />
		</div>
		<Pagination class="pagination-class" v-slot="{ page }" :items-per-page="itemsPerPage" :total="totalDocuments"
			:sibling-count="1" show-edges :default-page="1" @update:page="(newPage) => (currentPage = newPage)">
			<PaginationList v-slot="{ items }" class="flex items-center gap-1">
				<PaginationFirst />
				<PaginationPrev />

				<template v-for="(item, index) in items">
					<PaginationListItem v-if="item.type === 'page'" :key="index" :value="item.value" as-child>
						<Button class="pagination-btn p-0" :variant="item.value === page ? 'default' : 'outline'">
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
import { useUserStore } from "~/store/user.store"
import { useAdminStore } from "~/store/admin.store"
import { getInitialDocumentStatus } from "~/lib/documents"

definePageMeta({
	layout: "page",
})

const route = useRoute();
const userStore = useUserStore();
const adminStore = useAdminStore();
const { withLoader } = usePageLoader();

const counterparties = ref();
const documentsToLeads = useState('documentsToLeads', () => []);
const selectedDocumentIds = computed(() => documentsToLeads.value.map((doc: any) => doc.id));
const bulkSignButtonClass = computed(() => {
	const base = "page-button";
	return selectedDocumentIds.value.length === 0 ? `${base} opacity-50 cursor-not-allowed` : `${base} hover:active`;
});
const currentPage = ref(1); // Текущая страница
const windowHeight = ref(0); // Высота окна
const totalDocuments = ref(0); // Общее количество документов
const isLoading = ref(false); // Состояние загрузки

// Динамическое определение количества элементов на странице в зависимости от высоты экрана
const itemsPerPage = computed(() => {
	return 7;
	if (windowHeight.value === 0) return 6; // Значение по умолчанию

	// Приблизительная высота одного элемента документа (включая отступы)
	const itemHeight = 80; // px
	// Высота хедера, breadcrumbs, пагинации и отступов
	const reservedHeight = 400; // px

	// Доступная высота для списка документов
	const availableHeight = windowHeight.value - reservedHeight;

	// Вычисляем максимальное количество элементов
	const maxItems = Math.floor(availableHeight / itemHeight);

	// Минимум 3 элемента, максимум 12
	const result = Math.max(3, Math.min(12, maxItems));

	return result;
});

// Получаем данные для текущей страницы
const paginatedDocuments = computed(() => {
	// Теперь документы уже приходят отсортированными с сервера
	return adminStore.$state.filteredDocuments || [];
});

onBeforeMount(async () => {
	// // Устанавливаем начальную высоту окна
	// if (typeof window !== 'undefined') {
	// 	windowHeight.value = window.innerHeight;

	// 	// Отслеживаем изменения размера окна
	// 	const handleResize = () => {
	// 		windowHeight.value = window.innerHeight;
	// 	};

	// 	window.addEventListener('resize', handleResize);

	// 	// Очистка при размонтировании
	// 	onUnmounted(() => {
	// 		window.removeEventListener('resize', handleResize);
	// 	});
	// }

	watch(
		() => [userStore.isAuthInitialized, route.fullPath],
		async (newVal, routeFull) => {
			if (newVal) {
				await withLoader(async () => {
					await getDocument();
					await userStore.getCounterparties().then(() => {
						counterparties.value = userStore.$state.counterparties.map((counterparty) => ({
							value: counterparty.id,
							label: counterparty.organization_name,
						}));
					})
				});
			}
		},
		{
			immediate: true,
		}
	)

	// Отслеживаем изменение страницы и загружаем новые данные
	watch(currentPage, async (newPage) => {
		await getDocument();
	});
});

const getDocument = async () => {
	isLoading.value = true;
	try {
		const params = {
			page: currentPage.value,
			limit: itemsPerPage.value,
			sortBy: 'createdAt',
			sortOrder: 'desc' as 'desc',
			userId: undefined as number | undefined,
			leadId: undefined as number | undefined,
		};

		if (userStore.userRole !== "counterparty" && route.query.id === undefined) {
			// Админ - все документы
		} else if (route.query.id) {
			// Фильтр по leadId
			params.leadId = parseInt(route.query.id as string);
		} else {
			// Контрагент - только свои документы
			params.userId = userStore.userGetter.id;
		}

		// Загружаем пагинированные данные с сервера
		const response = await $fetch('/api/admin/document', {
			query: params,
		});

		if (response.code === 200 && response.body) {
			const data = response.body as any;
			adminStore.$state.documents = data.documents || [];
			adminStore.$state.filteredDocuments = data.documents || [];
			totalDocuments.value = data.total || 0;
		}
	} catch (error) {
		console.error('Error loading documents:', error);
	} finally {
		isLoading.value = false;
	}
};

const handleFileUpload = (event: Event, documentType: string) => {
	const target = event.target as HTMLInputElement;
	if (target.files && target.files[0]) {
		const file = target.files[0];
		// Здесь можно вызвать метод для загрузки документа
		uploadDocument(file, documentType);
	}
};

const uploadDocument = async (file: File, documentType: string) => {
	try {
		const status = getInitialDocumentStatus(documentType);
		const document = await adminStore.createDocument(
			{
				title: file.name,
				userId: userStore.userGetter.id,
				counterpartyId: userStore.userGetter ? userStore.userGetter.id : null,
				type: documentType,
				content: "Інформаційний",
				status
			},
			file
		).then(() => {
			setTimeout(() => {
				window.location.reload();
			}, 300);
		})
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

<style lang="scss" scoped>
.m-r-32 {
	margin-right: size(32px);
}

.m-b-18 {
	margin-bottom: size(18px);
}

.page-button {
	padding: size(8px) size(28px);
	border: size(2px) solid #007BFF;
	border-radius: size(14px);
	color: #007BFF;
	font-size: size(18px);
	font-weight: bold;
	font-family: 'Barlow', sans-serif;
	display: flex;
	align-items: center;
	gap: size(11px);
	position: relative;
	margin-right: size(24px);
}

.page-icon {
	width: size(19px);
	height: size(19px);
}

.gap-15 {
	gap: size(15px);
}

.gap-5 {
	gap: size(5px);
}

.m-b-26 {
	margin-bottom: size(26px);
}

.p-y-30 {
	padding-top: size(30px);
	padding-bottom: size(30px);
}

.p-x-42 {
	padding-left: size(42px);
	padding-right: size(42px);
}

.pagination-btn {
	width: size(36px);
	height: size(36px);
}
</style>

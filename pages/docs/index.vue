<template>
	<div class="page-container">
		<LayoutPageToolbar title="Документи">
			<template #actions>
				<DocumentSignDialogWindow :documents="selectedDocumentIds" trigger-label="Підписати обрані"
					:trigger-class="bulkSignButtonClass" :disabled="selectedDocumentIds.length === 0" />
			</template>
			<template #filters>
				<DocumentFilter :counterparties="counterparties" />
				<NuxtLink class="inline-flex items-center gap-2 h-10 px-6 rounded-field border border-brand-primary text-brand-primary font-semibold transition-colors hover:bg-brand-primary-soft" to="/docs/trash">
					<svg class="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
						<path stroke-linecap="round" stroke-linejoin="round"
							d="M9 3h6m-9 4h12m-10 0v12a1 1 0 001 1h6a1 1 0 001-1V7" />
						<path stroke-linecap="round" stroke-linejoin="round" d="M10 11v6m4-6v6" />
					</svg>
					Корзина
				</NuxtLink>
				<RefreshData :refreshFunction="async () => await getDocument()" />
			</template>
		</LayoutPageToolbar>
		<div class="flex items-center gap-[5px] mb-[26px]">
			<NuxtLink class="breadcrumbs" to="/docs">Документи</NuxtLink>
		</div>
		<div class="page__block py-[30px] px-[42px]">
			<DocumentComponent v-if="adminStore.$state.filteredDocuments && adminStore.$state.filteredDocuments.length > 0"
				:paginatedDocuments="paginatedDocuments" />
			<NotFoundDocument v-else />
		</div>
		<Pagination class="pagination-class" v-slot="{ page }" :items-per-page="itemsPerPage" :total="totalDocuments"
			:sibling-count="1" show-edges :default-page="currentPage" @update:page="onPageChange">
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
import { useUserStore } from "~/store/user.store"
import { useAdminStore } from "~/store/admin.store"
import { getInitialDocumentStatus } from "~/lib/documents"
import { useFetchApi } from "~/utils/api"

definePageMeta({
	layout: "page",
})

const route = useRoute();
const router = useRouter();
const userStore = useUserStore();
const adminStore = useAdminStore();
const { withLoader } = usePageLoader();

const counterparties = ref();
const documentsToLeads = useState('documentsToLeads', () => []);
const selectedDocumentIds = computed(() => documentsToLeads.value.map((doc: any) => doc.id));
const bulkSignButtonClass = computed(() => {
	const base = "inline-flex items-center gap-2 h-10 px-6 rounded-field border border-brand-primary text-brand-primary font-semibold transition-colors mr-[24px]";
	return selectedDocumentIds.value.length === 0
		? `${base} opacity-50 cursor-not-allowed`
		: `${base} hover:bg-brand-primary-soft`;
});
const getPageFromQuery = (value: string | string[] | undefined) => {
	const pageValue = Array.isArray(value) ? value[0] : value;
	const parsed = Number(pageValue);
	return Number.isInteger(parsed) && parsed > 0 ? parsed : 1;
};

const currentPage = ref(getPageFromQuery(route.query.page));
const totalDocuments = ref(0);
const isLoading = ref(false);

const itemsPerPage = computed(() => 12);

watch(
	() => route.query.page,
	(value) => {
		currentPage.value = getPageFromQuery(value);
	}
);

const onPageChange = async (newPage: number) => {
	currentPage.value = newPage;
	const query = { ...route.query };

	if (newPage <= 1) {
		delete query.page;
	} else {
		query.page = String(newPage);
	}

	await router.replace({ query });
};

const paginatedDocuments = computed(() => adminStore.$state.filteredDocuments || []);

onBeforeMount(() => {
	watch(
		() => [userStore.isAuthInitialized, route.path, route.query.id],
		async ([isAuthInitialized]) => {
			if (isAuthInitialized) {
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
		const response = await useFetchApi('/api/admin/document', {
			query: params,
		});

		if (response.code === 200 && response.body) {
			const data = response.body as { documents?: unknown[]; total?: number };
			adminStore.$state.documents = (data.documents as never) || [];
			adminStore.$state.filteredDocuments = (data.documents as never) || [];
			totalDocuments.value = data.total || 0;
		}
	} catch (error) {
		const { toast } = useToast();
		toast({ title: "Помилка", description: "Не вдалося завантажити документи", variant: "destructive" });
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
	} catch (error: unknown) {
		const { toast } = useToast();
		const message = error instanceof Error ? error.message : "Спробуйте пізніше";
		toast({ title: "Помилка", description: message, variant: "destructive" });
	}
};
</script>

<style lang="scss" scoped></style>

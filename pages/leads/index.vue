<template>
	<div class="page-container">
		<div class="w-full flex-center justify-between mb-[18px]">
			<div class="flex-center">
				<h2 class="page__title mr-[32px]">Угоди</h2>
				<LeadsDialogWindow v-if="userStore.userRole !== 'counterparty'" />
			</div>

			<div class="flex-center gap-[15px]">
				<LeadsFilter :counterparties="counterparties" />
				<RefreshData :refreshFunction="async () => await getLead()" />
			</div>
		</div>
		<div class="flex-center gap-[5px] mb-[26px]">
			<NuxtLink class="breadcrumbs" to="">Угоди</NuxtLink>
		</div>
		<div class="page__block py-[30px] px-[42px]">
			<LeadsFirstType v-if="paginatedLeads.length > 0" :invoices="paginatedLeads" />
			<NotFoundLead v-else />
		</div>
		<Pagination class="pagination-class" v-slot="{ page }" :items-per-page="itemsPerPage"
			:total="adminStore.$state.filteredLeads.length" :sibling-count="1" show-edges :default-page="currentPage"
			@update:page="onPageChange">
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
import { useAdminStore } from "~/store/admin.store"
import { useUserStore } from "~/store/user.store"
import { filterLeads, type LeadFilters } from "~/lib/leads"

definePageMeta({
	layout: "page",
})

const chatState = useState("isChat")

const route = useRoute()
const router = useRouter()

const adminStore = useAdminStore()
const userStore = useUserStore()
const { withLoader } = usePageLoader()
const leadFiltersState = useState<LeadFilters | null>("lead-filters", () => null);

const counterparties = ref<{ value: number; label: string }[]>([]);
const getPageFromQuery = (value: string | string[] | undefined) => {
	const pageValue = Array.isArray(value) ? value[0] : value;
	const parsed = Number(pageValue);
	return Number.isInteger(parsed) && parsed > 0 ? parsed : 1;
};

const currentPage = ref(getPageFromQuery(route.query.page)); // Текущая страница
const windowHeight = ref(0); // Высота окна

watch(
	() => route.query.page,
	(value) => {
		currentPage.value = getPageFromQuery(value);
	}
);

watch(
	() => adminStore.$state.filteredLeads.length,
	async (totalLeads) => {
		const maxPage = Math.max(1, Math.ceil(totalLeads / itemsPerPage.value));
		if (currentPage.value > maxPage) {
			await onPageChange(maxPage);
		}
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
const paginatedLeads = computed(() => {
	// Сначала сортируем договоры по дате создания (новые сначала)
	const sortedLeads = [...adminStore.$state.filteredLeads].sort((a, b) => {
		const dateA = new Date(a.createdAt || a.updatedAt || a.date || 0);
		const dateB = new Date(b.createdAt || b.updatedAt || b.date || 0);
		return dateB.getTime() - dateA.getTime(); // По убыванию (новые сначала)
	});

	// Затем применяем пагинацию к отсортированным данным
	const start = (currentPage.value - 1) * itemsPerPage.value;
	const end = start + itemsPerPage.value;
	const result = sortedLeads.slice(start, end);

	console.log('Paginated Leads:', {
		currentPage: currentPage.value,
		itemsPerPage: itemsPerPage.value,
		start,
		end,
		totalLeads: adminStore.$state.filteredLeads.length,
		resultLength: result.length
	});

	return result;
});
onBeforeMount(async () => {
	// Устанавливаем начальную высоту окна
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
		() => [userStore.isAuthInitialized, route.path, route.query.organizationId],
		async ([isAuthInitialized]) => {
			if (isAuthInitialized) {
				await withLoader(async () => {
					await getLead();
					await userStore.getCounterparties().then(() => {
						counterparties.value = userStore.$state.counterparties.map((counterparty) => ({
							value: counterparty.id,
							label: counterparty.organization_name,
						}));
					});
				});
			}
		},
		{
			immediate: true,
		}
	)
});

const getLead = async () => {
	if (userStore.userRole !== "counterparty") {
		await adminStore.getLeads();
	} else {
		await adminStore.getLeadByUserId(userStore.userGetter.id);
	}

	let filteredLeads = adminStore.$state.leads;
	const organizationId = Number(route.query.organizationId);
	if (Number.isFinite(organizationId) && organizationId > 0) {
		filteredLeads = filteredLeads.filter((lead: any) => lead.organizationId === organizationId);
	}

	if (leadFiltersState.value) {
		filteredLeads = filterLeads(filteredLeads, leadFiltersState.value);
	}

	adminStore.$state.filteredLeads = filteredLeads;
}
</script>

<style lang="scss" scoped></style>

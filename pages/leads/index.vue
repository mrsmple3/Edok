<template>
	<div class="page-container">
		<LayoutPageToolbar title="Угоди">
			<template #actions>
				<LeadsDialogWindow v-if="userStore.userRole !== 'counterparty'" />
			</template>
			<template #filters>
				<LeadsFilter :counterparties="counterparties" />
				<RefreshData :refreshFunction="async () => await getLead()" />
			</template>
		</LayoutPageToolbar>
		<div class="flex-center gap-[5px] mb-[26px]">
			<NuxtLink class="breadcrumbs" to="">Угоди</NuxtLink>
		</div>
		<div class="page__block py-[30px] px-[42px]">
			<LeadsFirstType v-if="paginatedLeads.length > 0" :invoices="paginatedLeads" />
			<NotFoundLead v-else />
		</div>
		<Pagination class="pagination-class" v-slot="{ page }" :items-per-page="itemsPerPage"
			:total="totalItems" :sibling-count="1" show-edges :default-page="currentPage"
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
import type { Lead } from "~/store/user.store";
import { byCreatedAtDesc, usePagedList } from "~/composables/usePagedList";
import { useAdminStore } from "~/store/admin.store";
import { useUserStore } from "~/store/user.store";
import { filterLeads, type LeadFilters } from "~/lib/leads";

definePageMeta({
	layout: "page",
});

const route = useRoute();

const adminStore = useAdminStore();
const userStore = useUserStore();
const { withLoader } = usePageLoader();
const leadFiltersState = useState<LeadFilters | null>("lead-filters", () => null);

const counterparties = ref<{ value: number; label: string }[]>([]);

const filteredLeadsSource = computed<Lead[]>(() => adminStore.$state.filteredLeads);

const {
	currentPage,
	itemsPerPage,
	totalItems,
	paginated: paginatedLeads,
	onPageChange,
} = usePagedList(filteredLeadsSource, {
	pageSize: 7,
	sort: byCreatedAtDesc,
});

const getLead = async () => {
	if (userStore.userRole !== "counterparty") {
		await adminStore.getLeads();
	} else {
		await adminStore.getLeadByUserId(userStore.userGetter.id);
	}

	let filtered = adminStore.$state.leads;
	const organizationId = Number(route.query.organizationId);
	if (Number.isFinite(organizationId) && organizationId > 0) {
		filtered = filtered.filter((lead: Lead) => lead.organizationId === organizationId);
	}

	if (leadFiltersState.value) {
		filtered = filterLeads(filtered, leadFiltersState.value);
	}

	adminStore.$state.filteredLeads = filtered;
};

onBeforeMount(() => {
	watch(
		() => [userStore.isAuthInitialized, route.path, route.query.organizationId],
		async ([isAuthInitialized]) => {
			if (isAuthInitialized) {
				await withLoader(async () => {
					await getLead();
					await userStore.getCounterparties();
					counterparties.value = userStore.$state.counterparties.map((c) => ({
						value: c.id,
						label: c.organization_name,
					}));
				});
			}
		},
		{ immediate: true },
	);
});
</script>

<style lang="scss" scoped></style>

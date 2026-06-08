<template>
  <div class="page-container">
    <LayoutPageToolbar title="Угоди">
      <template #actions>
        <LeadsDialogWindow />
      </template>
      <template #filters>
        <RefreshData :refreshFunction="async () => await adminStore.getLeadByUserId(userStore.userGetter.id)" />
      </template>
    </LayoutPageToolbar>
    <div class="flex-center gap-[5px] mb-[26px]">
      <NuxtLink class="breadcrumbs" to="">Угоди</NuxtLink>
    </div>
    <div class="page__block py-[30px] px-[42px]">
      <LeadsFirstType v-if="adminStore.$state.leads.length > 0" :invoices="paginatedLeads" />
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

definePageMeta({
  layout: "page",
});

const route = useRoute();

const adminStore = useAdminStore();
const userStore = useUserStore();
const { withLoader } = usePageLoader();

const leadsSource = computed<Lead[]>(() => adminStore.$state.leads);

const {
  currentPage,
  itemsPerPage,
  totalItems,
  paginated: paginatedLeads,
  onPageChange,
} = usePagedList(leadsSource, {
  pageSize: 7,
  sort: byCreatedAtDesc,
});

onBeforeMount(() => {
  watch(
    () => [userStore.isAuthInitialized, route.path, route.query.id],
    async ([isAuthInitialized]) => {
      if (isAuthInitialized) {
        await withLoader(async () => {
          await adminStore.getLeadByUserId(route.query.id);
        });
      }
    },
    { immediate: true },
  );
});
</script>

<style lang="scss" scoped></style>

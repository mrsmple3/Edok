<template>
  <div class="page-container">
    <div class="w-full flex-center justify-between mb-[18px]">
      <div class="flex-center">
        <h2 class="page__title mr-[32px]">Угоди</h2>
        <LeadsDialogWindow />
      </div>

      <div class="flex-center gap-[15px]">
        <Badge class="w-12 h-12 bg-[#2d9cdb]/20 rounded-[15px] hover:bg-[#2d9cdb]/30">
          <img alt="filter" src="/icons/filter.svg" />
        </Badge>
        <RefreshData :refreshFunction="async () => await adminStore.getLeadByUserId(userStore.userGetter.id)" />
      </div>
    </div>
    <div class="flex-center gap-[5px] mb-[26px]">
      <NuxtLink class="breadcrumbs" to="">Угоди</NuxtLink>
    </div>
    <div class="page__block py-[30px] px-[42px]">
      <LeadsFirstType v-if="adminStore.$state.leads.length > 0" :invoices="paginatedLeads" />
      <NotFoundLead v-else />
    </div>
    <Pagination class="pagination-class" v-slot="{ page }" :items-per-page="itemsPerPage"
      :total="adminStore.$state.leads.length" :sibling-count="1" show-edges :default-page="1"
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
import { useAdminStore } from "~/store/admin.store"
import { useUserStore } from "~/store/user.store"

definePageMeta({
  layout: "page",
})

const chatState = useState("isChat")

const route = useRoute()

const adminStore = useAdminStore()
const userStore = useUserStore()

const currentPage = ref(1); // Текущая страница
const itemsPerPage = 7; // Количество элементов на странице

// Получаем данные для текущей страницы
const paginatedLeads = computed(() => {
  const start = (currentPage.value - 1) * itemsPerPage;
  const end = start + itemsPerPage;
  return adminStore.$state.leads.slice(start, end);
});

// Общее количество страниц
const totalPages = computed(() => {
  return Math.ceil(adminStore.$state.leads.length / itemsPerPage);
});

onBeforeMount(async () => {
  watch(
    () => [userStore.isAuthInitialized, route.fullPath],
    async ([newVal, changedRoute]) => {
      if (newVal) {
        await adminStore.getLeadByUserId(route.query.id);
      }
    },
    {
      immediate: true,
    }
  )
});
</script>

<style lang="scss" scoped></style>

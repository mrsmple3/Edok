<template>
  <div class="page-container">
    <h2 class="page__title mb-[25px]">Архів</h2>
    <div class="flex items-center gap-[5px] mb-[26px]">
      <NuxtLink class="breadcrumbs" to="">Архів</NuxtLink>
    </div>
    <div class="page__block py-[30px] px-[42px]">
      <DocumentComponent v-if="adminStore.$state.signedDocuments.length > 0" :paginatedDocuments="paginatedDocuments" />
      <div v-else class="not-found">
        <img alt="not-found" class="min-h-max min-w-max w-[130px] h-[164px] mb-[44px]"
          src="/icons/file-wrong_svgrepo.com.svg">
        <h3 class="text-ink-700 text-[25px] font-semibold mb-[31px]">Тут нічого немає</h3>
        <p class="w-[950px] text-center text-ink-700 text-[20px] font-light">Система автоматично
          Тут нічого немає
          Система автоматично додає в розділ Архів документи, що вимагають дій з Вашого боку: підписання, узгодження або
          прийняття</p>
      </div>
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
import type { Document } from "~/store/user.store";
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

const signedSource = computed<Document[]>(() => adminStore.$state.signedDocuments);

const {
  currentPage,
  itemsPerPage,
  totalItems,
  paginated: paginatedDocuments,
  onPageChange,
} = usePagedList(signedSource, {
  pageSize: 7,
  sort: byCreatedAtDesc,
});

const loadSignedDocuments = async () => {
  if (userStore.userRole !== "counterparty") {
    await adminStore.getAllSignedDocuments();
  } else {
    await adminStore.getSignedDocumentsByUserId(userStore.$state.user.id);
  }
};

onBeforeMount(() => {
  watch(
    () => [userStore.isAuthInitialized, route.path],
    async ([isAuthInitialized]) => {
      if (isAuthInitialized) {
        await withLoader(loadSignedDocuments);
      }
    },
    { immediate: true },
  );
});
</script>


<style lang="scss" scoped></style>

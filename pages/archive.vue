<template>
  <div class="page-container">
    <h2 class="page__title mb-[25px]">Архів</h2>
    <div class="flex-center gap-[5px] mb-[26px]">
      <NuxtLink class="breadcrumbs" to="">Архів</NuxtLink>
    </div>
    <div class="page__block py-[30px] px-[42px]">
      <DocumentComponent v-if="adminStore.$state.signedDocuments.length > 0" :paginatedDocuments="paginatedDocuments" />
      <div v-else class="not-found">
        <img alt="not-found" class="min-h-max min-w-max w-[130px] h-[164px] mb-[44px]"
          src="/icons/file-wrong_svgrepo.com.svg">
        <h3 class="text-[#464154] text-[25px] font-semibold font-['Barlow'] mb-[31px]">Тут нічого немає</h3>
        <p class="w-[950px] text-center text-[#464154] text-[20px] font-light font-['Barlow']">Система автоматично
          Тут нічого немає
          Система автоматично додає в розділ Архів документи, що вимагають дій з Вашого боку: підписання, узгодження або
          прийняття</p>
      </div>
    </div>
    <Pagination class="pagination-class" v-slot="{ page }" :items-per-page="itemsPerPage"
      :total="adminStore.$state.signedDocuments.length" :sibling-count="1" show-edges :default-page="1"
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
import { useAdminStore } from '~/store/admin.store';
import { useUserStore } from '~/store/user.store';

definePageMeta({
  layout: 'page',
});

const route = useRoute();
const adminStore = useAdminStore();
const userStore = useUserStore();

const currentPage = ref(1); // Текущая страница
const itemsPerPage = 6; // Количество элементов на странице


// Получаем данные для текущей страницы
const paginatedDocuments = computed(() => {
  const start = (currentPage.value - 1) * itemsPerPage;
  const end = start + itemsPerPage;
  return adminStore.$state.signedDocuments.slice(start, end);
});

onBeforeMount(async () => {
  watch(() => [userStore.isAuthInitialized, route.fullPath],
    async (newVal, routeFull) => {
      if (newVal) {
        await getSignedDocuments();
      }
    },
    {
      immediate: true,
    }
  )
});

const getSignedDocuments = async () => {
  if (userStore.userRole !== 'counterparty') {
    await adminStore.getAllSignedDocuments();
  } else {
    await adminStore.getSignedDocumentsByUserId(userStore.$state.user.id);
  }
}
</script>


<style lang="scss" scoped></style>

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
const { withLoader } = usePageLoader();

const currentPage = ref(1); // Текущая страница
const windowHeight = ref(0); // Высота окна

// Динамическое определение количества элементов на странице в зависимости от высоты экрана
const itemsPerPage = computed(() => {
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
  // Сначала сортируем документы по дате (новые сначала)
  const sortedDocs = [...adminStore.$state.signedDocuments].sort((a, b) => {
    const dateA = new Date(a.createdAt);
    const dateB = new Date(b.createdAt);
    return dateB.getTime() - dateA.getTime();
  });

  // Затем применяем пагинацию
  const start = (currentPage.value - 1) * itemsPerPage.value;
  const end = start + itemsPerPage.value;
  const result = sortedDocs.slice(start, end);

  console.log('Paginated documents:', {
    currentPage: currentPage.value,
    itemsPerPage: itemsPerPage.value,
    start,
    end,
    totalDocuments: adminStore.$state.signedDocuments.length,
    resultLength: result.length
  });

  return result;
});

onBeforeMount(async () => {
  // Устанавливаем начальную высоту окна
  if (typeof window !== 'undefined') {
    windowHeight.value = window.innerHeight;

    // Отслеживаем изменения размера окна
    const handleResize = () => {
      windowHeight.value = window.innerHeight;
    };

    window.addEventListener('resize', handleResize);

    // Очистка при размонтировании
    onUnmounted(() => {
      window.removeEventListener('resize', handleResize);
    });
  }

  watch(() => [userStore.isAuthInitialized, route.fullPath],
    async (newVal, routeFull) => {
      if (newVal) {
        await withLoader(async () => {
          await getSignedDocuments();
        });
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

<template>
  <div class="page-container">
    <div class="w-full flex-center justify-between mb-[18px]">
      <div class="flex-center">
        <h2 class="page__title mr-[32px]">Документи</h2>

        <button
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
            <div class="cursor-pointer">
              <label for="confirming">Акт переоцінки</label>
              <input id="confirming" type="file" accept="application/pdf" class="hidden"
                @change="(event) => handleFileUpload(event, 'Акт переоцінки')" />
            </div>
            <div class="cursor-pointer">
              <label for="confirming">АКТ ЗВІРКИ</label>
              <input id="confirming" type="file" accept="application/pdf" class="hidden"
                @change="(event) => handleFileUpload(event, 'АКТ ЗВІРКИ')" />
            </div>
          </div>
        </button>
      </div>

      <div class="flex-center gap-[15px]">
        <DocumentFilter :counterparties="counterparties" />
        <RefreshData :refreshFunction="async () => await adminStore.getDocumentsByUserId(route.query.id)" />
      </div>
    </div>
    <div class="flex-center gap-[5px] mb-[26px]">
      <NuxtLink class="breadcrumbs" to="">Документи</NuxtLink>
    </div>
    <div class="page__block py-[30px] px-[42px]">
      <DocumentComponent v-if="adminStore.$state.documents.length > 0" :paginatedDocuments="paginatedDocuments" />
      <NotFoundDocument v-else />
    </div>
    <Pagination class="pagination-class" v-slot="{ page }" :items-per-page="itemsPerPage"
      :total="adminStore.$state.documents.length" :sibling-count="1" show-edges :default-page="1"
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
import { useUserStore } from "~/store/user.store"
import { useAdminStore } from "~/store/admin.store"
import { useToast } from "~/components/ui/toast"

definePageMeta({
  layout: "page",
})

const route = useRoute()
const userStore = useUserStore()
const adminStore = useAdminStore()
const { withLoader } = usePageLoader()

const counterparties = ref();

const selectedFile = ref<File | null>(null); // Хранение выбранного файла


const currentPage = ref(1); // Текущая страница
const windowHeight = ref(0); // Высота окна


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
  // Сначала сортируем документы по дате (новые сначала)
  const sortedDocs = [...adminStore.$state.filteredDocuments].sort((a, b) => {
    const dateA = new Date(a.createdAt);
    const dateB = new Date(b.createdAt);
    return dateB.getTime() - dateA.getTime(); // По убыванию (новые сначала)
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
    totalDocuments: adminStore.$state.filteredDocuments.length,
    resultLength: result.length
  });

  return result;
});

onBeforeMount(async () => {
  // Устанавливаем начальную высоту окна
  // if (typeof window !== 'undefined') {
  //   windowHeight.value = window.innerHeight;

  //   // Отслеживаем изменения размера окна
  //   const handleResize = () => {
  //     windowHeight.value = window.innerHeight;
  //   };

  //   window.addEventListener('resize', handleResize);

  //   // Очистка при размонтировании
  //   onUnmounted(() => {
  //     window.removeEventListener('resize', handleResize);
  //   });
  // }


  watch(() => [userStore.isAuthInitialized, route.fullPath],
    async (newVal, routeFull) => {
      if (newVal) {
        await withLoader(async () => {
          await adminStore.getDocumentsByLeadId(route.query.id).then(() => {
            adminStore.$state.filteredDocuments = adminStore.$state.documents;
          });
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
})

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
    // Проверяем валидность данных
    if (!route.query.id) {
      throw new Error('ID договору не знайдено');
    }

    if (!userStore.userGetter?.id) {
      throw new Error('Користувач не авторизований');
    }

    // Получаем данные о договоре
    const leadResult = await adminStore.getLeadById(Number(route.query.id));

    // Проверяем результат
    if (!leadResult) {
      throw new Error('Договір не знайдено');
    }

    const lead = leadResult;

    // Создаем документ с корректными данными
    await adminStore.createDocument(
      {
        title: file.name,
        userId: userStore.userGetter.id,
        counterpartyId: lead.counterpartyId,
        moderatorId: lead.moderatorsId,
        type: documentType,
        leadId: Number(route.query.id),
        content: "Інформаційний",
        status: 'В очікуванні'
      },
      file
    ).then(() => {
      setTimeout(() => {
        window.location.reload();
      }, 300);
    })

    // Обновляем список документов
    await adminStore.getDocumentsByLeadId(route.query.id);
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

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
              <label for="revaluation">Акт переоцінки</label>
              <input id="revaluation" type="file" accept="application/pdf" class="hidden"
                @change="(event) => handleFileUpload(event, 'Акт переоцінки')" />
            </div>
            <div class="cursor-pointer">
              <label for="guarantee-letter">Гарантійний лист</label>
              <input id="guarantee-letter" type="file" accept="application/pdf" class="hidden"
                @change="(event) => handleFileUpload(event, 'Гарантійний лист')" />
            </div>
            <div class="cursor-pointer">
              <label for="robit">Акт виконаних робіт/акт наданих послуг</label>
              <input id="robit" type="file" accept="application/pdf" class="hidden"
                @change="(event) => handleFileUpload(event, 'Акт виконаних робіт/акт наданих послуг')" />
            </div>
            <div class="cursor-pointer">
              <label for="reestr">Реєстр</label>
              <input id="reestr" type="file" accept="application/pdf" class="hidden"
                @change="(event) => handleFileUpload(event, 'Реєстр')" />
            </div>
            <div class="cursor-pointer">
              <label for="zayavka">Заявка</label>
              <input id="zayavka" type="file" accept="application/pdf" class="hidden"
                @change="(event) => handleFileUpload(event, 'Заявка')" />
            </div>
            <div class="cursor-pointer">
              <label for="animal">АКТ ЗВІРКИ</label>
              <input id="animal" type="file" accept="application/pdf" class="hidden"
                @change="(event) => handleFileUpload(event, 'АКТ ЗВІРКИ')" />
            </div>
          </div>
        </button>

        <DocumentSignDialogWindow :documents="selectedDocumentIds" trigger-label="Підписати обрані"
          :trigger-class="bulkSignButtonClass" :disabled="selectedDocumentIds.length === 0" />
      </div>

      <div class="flex-center gap-[15px]">
        <DocumentFilter :counterparties="counterparties" />
        <RefreshData :refreshFunction="async () => await getDocument()" />
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
      :total="totalDocuments" :sibling-count="1" show-edges :default-page="currentPage"
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
import { useUserStore } from "~/store/user.store"
import { useAdminStore } from "~/store/admin.store"
import { useToast } from "~/components/ui/toast"
import { getInitialDocumentStatus } from "~/lib/documents"

definePageMeta({
  layout: "page",
})

const route = useRoute()
const router = useRouter()
const userStore = useUserStore()
const adminStore = useAdminStore()
const { withLoader } = usePageLoader()

const counterparties = ref();

const documentsToLeads = useState('documentsToLeads', () => []);
const selectedDocumentIds = computed(() => documentsToLeads.value.map((doc: any) => doc.id));
const bulkSignButtonClass = computed(() => {
  const baseClass = "flex-center gap-[11px] rounded-[14px] border border-[#2d9cdb] py-2 px-7 text-[#2d9cdb] text-[18px] font-bold font-['Barlow'] mr-[24px]";
  return selectedDocumentIds.value.length === 0
    ? `${baseClass} opacity-50 cursor-not-allowed`
    : `${baseClass} hover:active`;
});

const selectedFile = ref<File | null>(null); // Хранение выбранного файла


const getPageFromQuery = (value: string | string[] | undefined) => {
  const pageValue = Array.isArray(value) ? value[0] : value;
  const parsed = Number(pageValue);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : 1;
};

const currentPage = ref(getPageFromQuery(route.query.page)); // Текущая страница
const windowHeight = ref(0); // Высота окна
const totalDocuments = ref(0);

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


// Динамическое определение количества элементов на странице в зависимости от высоты экрана
const itemsPerPage = computed(() => {
  return 12;
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

// На этой странице документы уже приходят постранично с сервера.
const paginatedDocuments = computed(() => {
  return adminStore.$state.filteredDocuments || [];
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


  watch(() => [userStore.isAuthInitialized, route.path, route.query.id],
    async (newVal, routeFull) => {
      if (newVal) {
        await withLoader(async () => {
          await getDocument();
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

watch(currentPage, async () => {
  await getDocument();
});

const getDocument = async () => {
  if (!route.query.id) {
    adminStore.$state.documents = [];
    adminStore.$state.filteredDocuments = [];
    totalDocuments.value = 0;
    return;
  }

  const response = await $fetch('/api/admin/document', {
    query: {
      page: currentPage.value,
      limit: itemsPerPage.value,
      sortBy: 'createdAt',
      sortOrder: 'desc',
      leadId: Number(route.query.id),
    },
  });

  if (response.code === 200 && response.body) {
    const data = response.body as any;
    adminStore.$state.documents = data.documents || [];
    adminStore.$state.filteredDocuments = data.documents || [];
    totalDocuments.value = data.total || 0;
  }
};

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
    const status = getInitialDocumentStatus(documentType);

    await adminStore.createDocument(
      {
        title: file.name,
        userId: userStore.userGetter.id,
        counterpartyId: lead.counterpartyId,
        moderatorId: lead.moderatorsId,
        type: documentType,
        leadId: Number(route.query.id),
        content: "Інформаційний",
        status
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

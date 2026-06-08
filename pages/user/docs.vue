<template>
  <div class="page-container">
    <LayoutPageToolbar title="Документи">
      <template #actions>
        <button
          class="submenu-parent relative flex items-center gap-[11px] rounded-field border border-brand-primary py-2 px-7 text-brand-primary text-[18px] font-bold mr-[24px]">
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

        <LeadsUserDialogWindow :getFunction="async () => await getDocument()"
          :counterpartyId="Number(route.query.id)" :documents="adminStore.$state.documents.map(doc => doc.id)" />

        <DocumentSignDialogWindow :documents="selectedDocumentIds" trigger-label="Підписати обрані"
          :trigger-class="bulkSignButtonClass" :disabled="selectedDocumentIds.length === 0" />
      </template>
      <template #filters>
        <DocumentFilter :counterparties="counterparties" />
        <RefreshData :refreshFunction="async () => await getDocument()" />
      </template>
    </LayoutPageToolbar>
    <div class="flex items-center gap-[5px] mb-[26px]">
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
import { useFetchApi } from "~/utils/api"

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
  const baseClass = "inline-flex items-center gap-[11px] rounded-field border border-brand-primary py-2 px-7 text-brand-primary text-[18px] font-bold mr-[24px] transition-colors";
  return selectedDocumentIds.value.length === 0
    ? `${baseClass} opacity-50 cursor-not-allowed`
    : `${baseClass} hover:bg-brand-primary-soft`;
});

const selectedFile = ref<File | null>(null); // Хранение выбранного файла


const getPageFromQuery = (value: string | string[] | undefined) => {
  const pageValue = Array.isArray(value) ? value[0] : value;
  const parsed = Number(pageValue);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : 1;
};

const currentPage = ref(getPageFromQuery(route.query.page));
const totalDocuments = ref(0);

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
  watch(() => [userStore.isAuthInitialized, route.path, route.query.id],
    async ([isAuthInitialized]) => {
      if (isAuthInitialized) {
        await withLoader(async () => {
          await getDocument();
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

  const response = await useFetchApi('/api/admin/document', {
    query: {
      page: currentPage.value,
      limit: itemsPerPage.value,
      sortBy: 'createdAt',
      sortOrder: 'desc',
      userId: Number(route.query.id),
    },
  });

  if (response.code === 200 && response.body) {
    const data = response.body as { documents?: unknown[]; total?: number };
    adminStore.$state.documents = (data.documents as never) || [];
    adminStore.$state.filteredDocuments = (data.documents as never) || [];
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
    const status = getInitialDocumentStatus(documentType);
    const document = await adminStore.createDocument(
      {
        title: file.name,
        userId: userStore.userGetter.id,
        counterpartyId: Number(route.query.id),
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

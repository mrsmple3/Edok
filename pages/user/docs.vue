<template>
  <div class="page-container">
    <div class="w-full flex-center justify-between mb-[18px]">
      <div class="flex-center">
        <h2 class="page__title mr-[32px]">Документи</h2>

        <button
          class="submenu-parent relative flex-center gap-[11px] rounded-[14px] border border-[#2d9cdb] py-2 px-7 text-[#2d9cdb] text-[18px] font-bold font-['Barlow'] mr-[24px] hover:active">
          <img alt="plus" class="w-[19px] h-[19px]" src="/icons/plus-blue.svg" />
          Добавить соглашение
          <div class="submenu">
            <div class="cursor-pointer">
              <label for="specification">Добавить спецификацию</label>
              <input id="specification" type="file" accept="application/pdf" class="hidden"
                @change="(event) => handleFileUpload(event, 'Спецификация')" />
            </div>
            <div class="cursor-pointer">
              <label for="check">Добавить счет</label>
              <input id="check" type="file" accept="application/pdf" class="hidden"
                @change="(event) => handleFileUpload(event, 'Счет')" />
            </div>
            <div class="cursor-pointer">
              <label for="invoice">Добавить накладную</label>
              <input id="invoice" type="file" accept="application/pdf" class="hidden"
                @change="(event) => handleFileUpload(event, 'Накладная')" />
            </div>
            <div class="cursor-pointer">
              <label for="confirming">Добавить подтверждающие документы</label>
              <input id="confirming" type="file" accept="application/pdf" class="hidden"
                @change="(event) => handleFileUpload(event, 'Подтверждающий документ')" />
            </div>
          </div>
        </button>

        <LeadsUserDialogWindow :getFunction="async () => await adminStore.getDocumentsByUserId(route.query.id)"
          :counterpartyId="Number(route.query.id)" :documents="adminStore.$state.documents.map(doc => doc.id)" />

        <!-- <div class="flex-center gap-6">
          <img alt="list" class="max-w-[24px] max-h-[24px] min-h-max min-w-max cursor-pointer" src="/icons/leads-icon-list-1.svg" />
          <img alt="list" class="max-w-[24px] max-h-[24px] min-h-max min-w-max cursor-pointer" src="/icons/leads-icon-list-2.svg" />
          <img alt="list" class="max-w-[24px] max-h-[24px] min-h-max min-w-max cursor-pointer" src="/icons/leads-icon-list-3.svg" />
          <img alt="list" class="max-w-[24px] max-h-[24px] min-h-max min-w-max cursor-pointer" src="/icons/leads-icon-list-4.svg" />
          <img alt="list" class="max-w-[24px] max-h-[24px] min-h-max min-w-max cursor-pointer" src="/icons/leads-icon-list-5.svg" />
        </div> -->
      </div>

      <div class="flex-center gap-[15px]">
        <!-- <Badge class="w-12 h-12 bg-[#2d9cdb]/20 rounded-[15px] hover:bg-[#2d9cdb]/30">
          <img alt="filter" src="/icons/filter.svg" />
        </Badge> -->
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

const selectedFile = ref<File | null>(null); // Хранение выбранного файла

const currentPage = ref(1); // Текущая страница
const itemsPerPage = 6; // Количество элементов на странице

// Получаем данные для текущей страницы
const paginatedDocuments = computed(() => {
  const start = (currentPage.value - 1) * itemsPerPage;
  const end = start + itemsPerPage;
  return adminStore.$state.documents.slice(start, end);
});

onBeforeMount(async () => {
  watch(() => [userStore.isAuthInitialized, route.fullPath],
    async (newVal, routeFull) => {
      if (newVal) {
        await adminStore.getDocumentsByUserId(route.query.id).then(() => {
          adminStore.$state.filteredDocuments = adminStore.$state.documents;
        })
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
  console.log(Number(route.query.id));
  try {
    const document = await adminStore.createDocument(
      {
        title: file.name,
        userId: userStore.userGetter.id,
        counterpartyId: Number(route.query.id),
        type: documentType,
        content: "Информационный",
        status: 'В ожидании'
      },
      file
    );
  } catch (error: any) {
    const { toast } = useToast();
    console.log(error);

    if (error.message) {
      toast({
        title: "Ошибка",
        description: error.message,
        variant: "destructive",
      });
    } else {
      toast({
        title: "Неизвестная ошибка",
        description: "Попробуйте позже",
        variant: "destructive",
      });
    }
  }
};
</script>

<style lang="scss" scoped></style>

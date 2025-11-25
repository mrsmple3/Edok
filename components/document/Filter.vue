<template>
  <Dialog v-model:open="isDialogOpen">
    <DialogTrigger>
      <Badge class="filter-badge bg-[#2d9cdb]/20 hover:bg-[#2d9cdb]/30">
        <img alt="фільтр" src="/icons/filter.svg" />
      </Badge>
    </DialogTrigger>
    <DialogContent class="max-w-2xl">
      <DialogHeader>
        <DialogTitle>Фільтр документів</DialogTitle>
        <DialogDescription>Налаштуйте параметри для пошуку документів</DialogDescription>
      </DialogHeader>

      <div class="grid gap-6 py-4">
        <!-- Фильтры по датам -->
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div class="space-y-2">
            <label class="text-sm font-medium">Дата створення</label>
            <RangeCalendar v-model="value" class="rounded-md border" :maxValue="todayDate" />
          </div>
          <div class="space-y-2">
            <label class="text-sm font-medium">Дата документа</label>
            <RangeCalendar v-model="documentDateRange" class="rounded-md border" :maxValue="todayDate" />
          </div>
        </div>

        <!-- Фильтр по контрагенту -->
        <div class="space-y-2">
          <label class="text-sm font-medium">Контрагент</label>
          <Combobox v-model="filters.counterparty" by="label">
            <ComboboxAnchor>
              <div class="relative w-full">
                <ComboboxInput
                  class="w-full px-3 py-2 border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  :display-value="(val) => val?.label ?? ''"
                  placeholder="Оберіть або введіть організацію контрагента..." />
              </div>
            </ComboboxAnchor>
            <ComboboxList class="mt-1 bg-white border border-gray-200 rounded-md shadow-lg max-h-60 overflow-auto">
              <ComboboxEmpty class="py-2 px-3 text-sm text-gray-500">
                Не знайдено контрагентів.
              </ComboboxEmpty>
              <ComboboxGroup>
                <ComboboxItem v-for="(counterparty, index) in counterparties" :key="index" :value="counterparty"
                  class="cursor-pointer px-3 py-2 text-sm hover:bg-gray-100 flex items-center justify-between">
                  {{ counterparty.label }}
                  <ComboboxItemIndicator>
                    <Check class="w-4 h-4 text-blue-600" />
                  </ComboboxItemIndicator>
                </ComboboxItem>
              </ComboboxGroup>
            </ComboboxList>
          </Combobox>
        </div>

        <!-- Текстовые фильтры -->
        <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div class="space-y-2">
            <label class="text-sm font-medium">ЄДРПОУ поставщика</label>
            <Input v-model="filters.edrpou" placeholder="Введіть ЄДРПОУ..." class="w-full" />
          </div>
          <div class="space-y-2">
            <label class="text-sm font-medium">Номер документа</label>
            <Input v-model="filters.documentNumber" placeholder="Введіть номер..." class="w-full" />
          </div>
          <div class="space-y-2">
            <label class="text-sm font-medium">Назва документа</label>
            <Input v-model="filters.documentTitle" placeholder="Введіть назву..." class="w-full" />
          </div>
          <div class="space-y-2">
            <label class="text-sm font-medium">Тип документа</label>
            <Select v-model="filters.documentType">
              <SelectTrigger class="w-full">
                <SelectValue placeholder="Оберіть тип" />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  <SelectItem value="">
                    Всі типи
                  </SelectItem>
                  <SelectItem v-for="type in documentTypes" :key="type" :value="type">
                    {{ type }}
                  </SelectItem>
                </SelectGroup>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      <DialogFooter class="flex justify-between">
        <Button variant="outline" @click="resetFilters" class="flex items-center gap-2">
          <img alt="скинути" src="/icons/restar.svg" class="w-4 h-4" />
          Скинути
        </Button>
        <Button @click="handleApplyFilters" class="bg-[#2d9cdb] hover:bg-[#2d9cdb]/90">
          Застосувати фільтр
        </Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
</template>

<script setup lang="ts">
import { ref, watch, computed, type Ref } from "vue";
import { today, getLocalTimeZone } from "@internationalized/date";
import { useUserStore } from "~/store/user.store";
import { useAdminStore } from "~/store/admin.store";
import type { DateRange } from "radix-vue";

defineProps({
  counterparties: {
    type: Array,
    required: true,
  },
});

const userStore = useUserStore();
const adminStore = useAdminStore();

// Контроль состояния диалога
const isDialogOpen = ref(false);

const todayDate = today(getLocalTimeZone());

const start = today(getLocalTimeZone()).subtract({ days: 7 });
const end = today(getLocalTimeZone());

const value = ref<DateRange>({
  start,
  end,
}) as Ref<DateRange>;

// Отдельный календарь для даты документа
const documentDateRange = ref<DateRange>({
  start: today(getLocalTimeZone()).subtract({ days: 30 }),
  end: today(getLocalTimeZone()),
}) as Ref<DateRange>;

const filters = ref({
  dateRange: null as DateRange | null, // Диапазон дат создания
  documentDateRange: null as DateRange | null, // Диапазон дат документа
  counterparty: null, // Выбранный контрагент
  edrpou: '', // ЕДРПОУ поставщика
  documentNumber: '', // Номер документа
  documentTitle: '', // Название документа
  documentType: '', // Тип документа
});

const documentTypes = computed(() => {
  const types = new Set<string>();
  (adminStore.$state.documents || []).forEach((doc: any) => {
    if (doc?.type) {
      types.add(doc.type);
    }
  });
  return Array.from(types);
});

// Следим за изменениями календаря создания
watch(value, (newValue: DateRange) => {
  filters.value.dateRange = newValue;
}, { deep: true });

// Следим за изменениями календаря даты документа
watch(documentDateRange, (newValue: DateRange) => {
  filters.value.documentDateRange = newValue;
}, { deep: true });

const applyFilters = () => {
  const { dateRange, documentDateRange, counterparty, edrpou, documentNumber, documentTitle, documentType } = filters.value;

  // Фильтруем документы
  const filteredDocuments = adminStore.$state.documents.filter((doc: any) => {
    let isWithinCreationDateRange = true;
    let isWithinDocumentDateRange = true;
    let isCounterpartyMatch = true;
    let isEdrpouMatch = true;
    let isDocumentNumberMatch = true;
    let isDocumentTitleMatch = true;
    let isDocumentTypeMatch = true;

    // Фильтр по дате создания
    if (dateRange && (dateRange.start || dateRange.end)) {
      const docDate = new Date(doc.createdAt);

      if (dateRange.start) {
        const startDate = new Date(dateRange.start.toString());
        startDate.setHours(0, 0, 0, 0);
        isWithinCreationDateRange = isWithinCreationDateRange && docDate >= startDate;
      }

      if (dateRange.end) {
        const endDate = new Date(dateRange.end.toString());
        endDate.setHours(23, 59, 59, 999);
        isWithinCreationDateRange = isWithinCreationDateRange && docDate <= endDate;
      }
    }

    // Фильтр по дате документа
    if (documentDateRange && (documentDateRange.start || documentDateRange.end)) {
      const docDate = doc.documentDate ? new Date(doc.documentDate) : new Date(doc.createdAt);

      if (documentDateRange.start) {
        const startDate = new Date(documentDateRange.start.toString());
        startDate.setHours(0, 0, 0, 0);
        isWithinDocumentDateRange = isWithinDocumentDateRange && docDate >= startDate;
      }

      if (documentDateRange.end) {
        const endDate = new Date(documentDateRange.end.toString());
        endDate.setHours(23, 59, 59, 999);
        isWithinDocumentDateRange = isWithinDocumentDateRange && docDate <= endDate;
      }
    }

    // Фильтр по контрагенту
    if (counterparty && (counterparty as any).value) {
      isCounterpartyMatch = doc.counterpartyId === (counterparty as any).value;
    }

    // Фильтр по ЕДРПОУ поставщика
    if (edrpou.trim()) {
      const supplierEdrpou = doc.counterparty?.organization_INN || '';
      isEdrpouMatch = supplierEdrpou.toLowerCase().includes(edrpou.toLowerCase());
    }

    // Фильтр по номеру документа
    if (documentNumber.trim()) {
      const docNumber = doc.id.toString() || '';
      isDocumentNumberMatch = docNumber.toLowerCase().includes(documentNumber.toLowerCase());
    }

    // Фильтр по названию документа
    if (documentTitle.trim()) {
      const docTitle = doc.title || doc.name || '';
      isDocumentTitleMatch = docTitle.toLowerCase().includes(documentTitle.toLowerCase());
    }

    if (documentType) {
      isDocumentTypeMatch = doc.type === documentType;
    }

    return isWithinCreationDateRange &&
      isWithinDocumentDateRange &&
      isCounterpartyMatch &&
      isEdrpouMatch &&
      isDocumentNumberMatch &&
      isDocumentTitleMatch &&
      isDocumentTypeMatch;
  });

  // Обновляем отображаемые документы
  adminStore.$state.filteredDocuments = filteredDocuments;

  console.log('Применены фильтры:', {
    dateRange,
    documentDateRange,
    counterparty,
    edrpou,
    documentNumber,
    documentTitle,
    documentType,
    totalDocuments: adminStore.$state.documents.length,
    filteredDocuments: filteredDocuments.length
  });
};

const handleApplyFilters = () => {
  applyFilters();
  isDialogOpen.value = false; // Закрываем диалог
};

const resetFilters = () => {
  // Сбрасываем фильтры
  filters.value = {
    dateRange: null,
    documentDateRange: null,
    counterparty: null,
    edrpou: '',
    documentNumber: '',
    documentTitle: '',
    documentType: '',
  };

  // Сбрасываем календарь к начальным значениям
  value.value = {
    start: today(getLocalTimeZone()).subtract({ days: 7 }),
    end: today(getLocalTimeZone()),
  };

  // Сбрасываем календарь даты документа
  documentDateRange.value = {
    start: today(getLocalTimeZone()).subtract({ days: 30 }),
    end: today(getLocalTimeZone()),
  };

  // Сбрасываем отфильтрованные документы к исходным
  adminStore.$state.filteredDocuments = adminStore.$state.documents;

  console.log('Фильтры сброшены');
  isDialogOpen.value = false; // Закрываем диалог
};
</script>

<style scoped lang="scss">
.filter-badge {
  width: size(48px);
  height: size(48px);
  border-radius: 15px;
  display: flex;
  align-items: center;
  justify-content: center;
}
</style>

<template>
  <Dialog v-model:open="isDialogOpen">
    <DialogTrigger>
      <Badge class="filter-badge bg-[#2d9cdb]/20 hover:bg-[#2d9cdb]/30">
        <img alt="фільтр" src="/icons/filter.svg" />
      </Badge>
    </DialogTrigger>
    <DialogContent class="w-max">
      <DialogHeader>
        <DialogTitle>Фільтр</DialogTitle>
        <DialogDescription>Ви можете фільтрувати документи за параметрами</DialogDescription>
      </DialogHeader>
      <DialogDescription>
        Дата створення
        <RangeCalendar v-model="value" class="w-max	rounded-md border" :maxValue="todayDate" />
      </DialogDescription>
      <DialogDescription>
        Контрагент
        <Combobox v-model="filters.counterparty" by="label">
          <ComboboxAnchor>
            <div class="relative w-full items-center">
              <ComboboxInput class="combobox-input" :display-value="(val) => val?.label ?? ''"
                placeholder="Введіть організацію контрагента..." />
            </div>
          </ComboboxAnchor>

          <ComboboxList>
            <ComboboxEmpty>
              Не знайдено контрагентів.
            </ComboboxEmpty>

            <ComboboxGroup>
              <ComboboxItem v-for="(counterparty, index) in counterparties" :key="index" :value="counterparty">
                {{ counterparty.label }}
                <ComboboxItemIndicator>
                  <Check :class="cn('check-icon ml-auto')" />
                </ComboboxItemIndicator>
              </ComboboxItem>
            </ComboboxGroup>
          </ComboboxList>
        </Combobox>
      </DialogDescription>
      <DialogFooter>
        <Button variant="outline" @click="resetFilters" class="flex items-center gap-2">
          <img alt="скинути" src="/icons/restar.svg" class="reset-icon" />
          Скинути
        </Button>
        <Button @click="handleApplyFilters">Застосувати</Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
</template>

<script setup lang="ts">
defineProps({
  counterparties: {
    type: Array,
    required: true,
  },
});
import { today, getLocalTimeZone } from "@internationalized/date";
import { useUserStore } from "~/store/user.store"
import { useAdminStore } from "~/store/admin.store"
import type { DateRange } from "radix-vue"
import { cn } from "@/lib/utils";


const userStore = useUserStore()
const adminStore = useAdminStore()

// Контроль состояния диалога
const isDialogOpen = ref(false)

const todayDate = today(getLocalTimeZone());

const start = today(getLocalTimeZone()).subtract({ days: 7 });
const end = today(getLocalTimeZone());

const value = ref<DateRange>({
  start,
  end,
}) as Ref<DateRange>;

const filters = ref({
  dateRange: null as DateRange | null, // Диапазон дат
  counterparty: null, // Выбранный контрагент
});

// Следим за изменениями календаря
watch(value, (newValue) => {
  filters.value.dateRange = newValue;
}, { deep: true });

const applyFilters = () => {
  const { dateRange, counterparty } = filters.value;

  // Фильтруем документы
  const filteredDocuments = adminStore.$state.documents.filter((doc: any) => {
    let isWithinDateRange = true;
    let isCounterpartyMatch = true;

    // Фильтр по дате
    if (dateRange && (dateRange.start || dateRange.end)) {
      const docDate = new Date(doc.createdAt);

      if (dateRange.start) {
        const startDate = new Date(dateRange.start.toString());
        startDate.setHours(0, 0, 0, 0); // Начало дня
        isWithinDateRange = isWithinDateRange && docDate >= startDate;
      }

      if (dateRange.end) {
        const endDate = new Date(dateRange.end.toString());
        endDate.setHours(23, 59, 59, 999); // Конец дня
        isWithinDateRange = isWithinDateRange && docDate <= endDate;
      }
    }

    // Фильтр по контрагенту
    if (counterparty && counterparty.value) {
      isCounterpartyMatch = doc.counterpartyId === counterparty.value;
    }

    return isWithinDateRange && isCounterpartyMatch;
  });

  // Обновляем отображаемые документы
  adminStore.$state.filteredDocuments = filteredDocuments;

  console.log('Применены фильтры:', {
    dateRange: dateRange,
    counterparty: counterparty,
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
    counterparty: null,
  };

  // Сбрасываем календарь к начальным значениям
  value.value = {
    start: today(getLocalTimeZone()).subtract({ days: 7 }),
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
  border-radius: size(15px);
}

.combobox-input {
  padding-left: size(36px);
}

.check-icon {
  height: size(16px);
  width: size(16px);
}

.reset-icon {
  width: size(20px);
  height: size(20px);
}
</style>

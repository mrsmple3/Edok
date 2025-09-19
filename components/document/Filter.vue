<template>
  <Dialog>
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
        <Button @click="applyFilters">Застосувати</Button>
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

const todayDate = today(getLocalTimeZone());

const start = today(getLocalTimeZone());
const end = start.add({ days: -7 });

const value = ref<DateRange>({
  start,
  end,
}) as Ref<DateRange>;

const filters = ref({
  dateRange: value, // Используем уже существующий `value` для диапазона дат
  counterparty: null, // Выбранный контрагент
});

watch(value, (newValue) => {
  filters.value.dateRange = newValue;
});

const applyFilters = () => {
  const { dateRange, counterparty } = filters.value;

  // Фильтруем документы
  const filteredDocuments = adminStore.$state.documents.filter((doc) => {
    const isWithinDateRange =
      (!dateRange.start || new Date(doc.createdAt) >= new Date(dateRange.start.toString())) &&
      (!dateRange.end || new Date(doc.createdAt) <= new Date(dateRange.end.toString()));

    const isCounterpartyMatch = !counterparty || doc.counterpartyId === counterparty.value;

    return isWithinDateRange && isCounterpartyMatch;
  });

  // Обновляем отображаемые документы
  adminStore.$state.filteredDocuments = filteredDocuments;
};

const resetFilters = () => {
  filters.value = {
    dateRange: value,
    counterparty: null,
  };

  // Сбрасываем отфильтрованные документы к исходным
  adminStore.$state.filteredDocuments = adminStore.$state.documents;
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

<template>
  <Dialog>
    <DialogTrigger>
      <Badge class="w-12 h-12 bg-[#2d9cdb]/20 rounded-[15px] hover:bg-[#2d9cdb]/30">
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
              <ComboboxInput class="pl-9" :display-value="(val) => val?.label ?? ''"
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
                  <Check :class="cn('ml-auto h-4 w-4')" />
                </ComboboxItemIndicator>
              </ComboboxItem>
            </ComboboxGroup>
          </ComboboxList>
        </Combobox>
      </DialogDescription>
      <DialogFooter>
        <Button variant="outline" @click="resetFilters" class="flex items-center gap-2">
          <img alt="скинути" src="/icons/restar.svg" class="w-5 h-5" />
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

<style scoped></style>

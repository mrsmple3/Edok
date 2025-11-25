<template>
  <Dialog v-model:open="isDialogOpen">
    <DialogTrigger>
      <Badge class="filter-badge bg-[#2d9cdb]/20 hover:bg-[#2d9cdb]/30">
        <img alt="фільтр" src="/icons/filter.svg" />
      </Badge>
    </DialogTrigger>
    <DialogContent class="max-w-2xl">
      <DialogHeader>
        <DialogTitle>Фільтр угод</DialogTitle>
        <DialogDescription>Налаштуйте параметри для пошуку потрібного договору</DialogDescription>
      </DialogHeader>

      <div class="grid gap-6 py-4">
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div class="space-y-2">
            <label class="text-sm font-medium">Дата створення</label>
            <RangeCalendar v-model="value" class="rounded-md border" :maxValue="todayDate" />
          </div>
          <div class="space-y-2">
            <label class="text-sm font-medium">Статус угоди</label>
            <Select v-model="filters.status">
              <SelectTrigger class="w-full">
                <SelectValue placeholder="Оберіть статус" />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  <SelectItem v-for="status in leadStatuses" :key="status" :value="status">
                    {{ status }}
                  </SelectItem>
                </SelectGroup>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div class="space-y-2">
          <label class="text-sm font-medium">Контрагент</label>
          <Combobox v-model="filters.counterparty" by="label">
            <ComboboxAnchor>
              <div class="relative w-full">
                <ComboboxInput
                  class="w-full px-3 py-2 border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  :display-value="(val) => val?.label ?? ''"
                  placeholder="Оберіть або введіть назву контрагента..." />
              </div>
            </ComboboxAnchor>
            <ComboboxList class="mt-1 bg-white border border-gray-200 rounded-md shadow-lg max-h-60 overflow-auto">
              <ComboboxEmpty class="py-2 px-3 text-sm text-gray-500">
                Не знайдено контрагентів.
              </ComboboxEmpty>
              <ComboboxGroup>
                <ComboboxItem v-for="(counterparty, index) in counterpartiesList" :key="index" :value="counterparty"
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

        <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div class="space-y-2">
            <label class="text-sm font-medium">ЄДРПОУ</label>
            <Input v-model="filters.inn" placeholder="Введіть ЄДРПОУ контрагента..." class="w-full" />
          </div>
          <div class="space-y-2">
            <label class="text-sm font-medium">Тип угоди</label>
            <Input v-model="filters.type" placeholder="Наприклад, Договір поставки" class="w-full" />
          </div>
          <div class="space-y-2">
            <label class="text-sm font-medium">Назва угоди</label>
            <Input v-model="filters.name" placeholder="Введіть назву або її частину..." class="w-full" />
          </div>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div class="space-y-2">
            <label class="text-sm font-medium">Модератор</label>
            <Input v-model="filters.moderator" placeholder="Ім'я, прізвище або email модератора" class="w-full" />
          </div>
          <div class="space-y-2">
            <label class="text-sm font-medium">ID угоди</label>
            <Input v-model="filters.leadId" placeholder="Наприклад, 123" class="w-full" />
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
import { useAdminStore } from "~/store/admin.store";
import type { DateRange } from "radix-vue";

const props = defineProps({
  counterparties: {
    type: Array,
    required: true,
  },
});

const adminStore = useAdminStore();
const counterpartiesList = computed(() => props.counterparties ?? []);

const isDialogOpen = ref(false);
const todayDate = today(getLocalTimeZone());

const value = ref<DateRange>({
  start: today(getLocalTimeZone()).subtract({ days: 30 }),
  end: today(getLocalTimeZone()),
}) as Ref<DateRange>;

const filters = ref({
  dateRange: null as DateRange | null,
  counterparty: null as any,
  inn: "",
  name: "",
  type: "",
  status: "",
  moderator: "",
  leadId: "",
});

watch(value, (newValue: DateRange) => {
  filters.value.dateRange = newValue;
}, { deep: true });

const leadStatuses = computed(() => {
  const statuses = new Set<string>();
  (adminStore.$state.leads || []).forEach((lead: any) => {
    if (lead?.status) {
      statuses.add(lead.status);
    }
  });
  return Array.from(statuses);
});

const normalizeString = (str?: string | null) => (str ?? "").toLowerCase();

const applyFilters = () => {
  const { dateRange, counterparty, inn, name, type, status, moderator, leadId } = filters.value;
  const normalizedInn = inn.trim().toLowerCase();
  const normalizedName = name.trim().toLowerCase();
  const normalizedType = type.trim().toLowerCase();
  const normalizedModerator = moderator.trim().toLowerCase();
  const numericLeadId = leadId.trim() ? Number(leadId) : null;

  const filteredLeads = (adminStore.$state.leads || []).filter((lead: any) => {
    let matchesCreationDate = true;
    if (dateRange && (dateRange.start || dateRange.end)) {
      const leadDate = new Date(lead?.createdAt || lead?.updatedAt || lead?.date || 0);

      if (dateRange.start) {
        const startDate = new Date(dateRange.start.toString());
        startDate.setHours(0, 0, 0, 0);
        matchesCreationDate = matchesCreationDate && leadDate >= startDate;
      }

      if (dateRange.end) {
        const endDate = new Date(dateRange.end.toString());
        endDate.setHours(23, 59, 59, 999);
        matchesCreationDate = matchesCreationDate && leadDate <= endDate;
      }
    }

    let matchesCounterparty = true;
    if (counterparty && (counterparty as any).value) {
      matchesCounterparty = lead?.counterpartyId === (counterparty as any).value;
    }

    let matchesInn = true;
    if (normalizedInn) {
      const leadInn = normalizeString(lead?.counterparty?.organization_INN || lead?.counterparty?.organization_inn);
      matchesInn = leadInn.includes(normalizedInn);
    }

    let matchesName = true;
    if (normalizedName) {
      const leadName = normalizeString(lead?.name);
      matchesName = leadName.includes(normalizedName);
    }

    let matchesType = true;
    if (normalizedType) {
      const leadType = normalizeString(lead?.type);
      matchesType = leadType.includes(normalizedType);
    }

    let matchesStatus = true;
    if (status) {
      matchesStatus = lead?.status === status;
    }

    let matchesModerator = true;
    if (normalizedModerator) {
      const moderatorFullName = [
        lead?.moderators?.surname,
        lead?.moderators?.name,
        lead?.moderators?.patronymic,
      ].filter(Boolean).join(" ");
      const moderatorSearchTarget = `${moderatorFullName} ${lead?.moderators?.email ?? ""}`.toLowerCase();
      matchesModerator = moderatorSearchTarget.includes(normalizedModerator);
    }

    let matchesLeadId = true;
    if (numericLeadId !== null && !Number.isNaN(numericLeadId)) {
      matchesLeadId = lead?.id === numericLeadId;
    }

    return matchesCreationDate &&
      matchesCounterparty &&
      matchesInn &&
      matchesName &&
      matchesType &&
      matchesStatus &&
      matchesModerator &&
      matchesLeadId;
  });

  adminStore.$state.filteredLeads = filteredLeads;

  console.log("Застосовано фільтри до угод:", {
    totalLeads: adminStore.$state.leads.length,
    filteredLeads: filteredLeads.length,
    filters: filters.value,
  });
};

const handleApplyFilters = () => {
  applyFilters();
  isDialogOpen.value = false;
};

const resetFilters = () => {
  filters.value = {
    dateRange: null,
    counterparty: null,
    inn: "",
    name: "",
    type: "",
    status: "",
    moderator: "",
    leadId: "",
  };

  value.value = {
    start: today(getLocalTimeZone()).subtract({ days: 30 }),
    end: today(getLocalTimeZone()),
  };

  adminStore.$state.filteredLeads = adminStore.$state.leads;
  console.log("Фільтр угод скинуто");
  isDialogOpen.value = false;
};
</script>

<style scoped>
.filter-badge {
  width: 48px;
  height: 48px;
  border-radius: 15px;
  display: flex;
  align-items: center;
  justify-content: center;
}
</style>

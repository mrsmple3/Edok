<template>
  <Table class="w-full">
    <TableHeader class="table-header">
      <TableRow class="border-none">
        <TableHead class="t-head">Назва документа</TableHead>
        <TableHead class="t-head">Угода</TableHead>
        <TableHead class="t-head">Контрагент</TableHead>
        <TableHead class="t-head">Завантажено</TableHead>
        <TableHead class="t-head">Автор</TableHead>
        <TableHead class="t-head">Погоджуючі</TableHead>
      </TableRow>
    </TableHeader>
    <DocumentViewer v-if="documentView" :documentUrl="documentUrl" />
    <TableBody class="w-full">
      <DocumentTable v-for="(invoice, index) in sortedDocuments" :key="index" :invoice="invoice" />
    </TableBody>
  </Table>
</template>

<script setup lang="ts">
import { computed, type PropType } from 'vue'
import { useToast } from "~/components/ui/toast"
import { useUserStore, type Document } from "~/store/user.store"
import { useAdminStore } from "~/store/admin.store"

const props = defineProps({
  paginatedDocuments: {
    type: Array as PropType<Document[]>,
    required: true,
  },
});

const route = useRoute()
const userStore = useUserStore()
const adminStore = useAdminStore()

const documentView = useState("isDocumentView", () => false);
const documentUrl = useState("documentUrl", () => "");

// Функция для преобразования даты из формата DD.MM.YYYY в Date объект
const parseDate = (dateStr: string | undefined): Date => {
  if (!dateStr) return new Date(0);

  // Если дата уже в формате ISO или стандартном формате
  if (dateStr.includes('T') || dateStr.includes('-')) {
    return new Date(dateStr);
  }

  // Если дата в формате DD.MM.YYYY
  if (dateStr.includes('.')) {
    const [day, month, year] = dateStr.split('.');
    return new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
  }

  // Fallback для других форматов
  return new Date(dateStr);
};

// Сортировка документов по дате (новые сначала)
const sortedDocuments = computed(() => {
  return [...props.paginatedDocuments].sort((a, b) => {
    const dateA = parseDate(a.createdAt || a.uploadedAt || a.date);
    const dateB = parseDate(b.createdAt || b.uploadedAt || b.date);
    return dateB.getTime() - dateA.getTime(); // По убыванию (новые сначала)
  });
});
</script>

<style scoped lang="scss">
.table-header {
  width: 100%;
  height: size(80px);
}
</style>

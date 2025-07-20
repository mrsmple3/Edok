<template>
  <Table class="w-full">
    <TableHeader class="w-full h-[80px]">
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
      <DocumentTable v-for="(invoice, index) in paginatedDocuments" :key="index" :invoice="invoice" />
    </TableBody>
  </Table>
</template>

<script setup lang="ts">
defineProps({
  paginatedDocuments: {
    type: Array as PropType<Document[]>,
    required: true,
  },
});
import { useToast } from "~/components/ui/toast"
import { useUserStore, type Document } from "~/store/user.store"
import { useAdminStore } from "~/store/admin.store"

const route = useRoute()
const userStore = useUserStore()
const adminStore = useAdminStore()

const documentView = useState("isDocumentView", () => false);
const documentUrl = useState("documentUrl", () => "");
</script>

<style scoped lang="scss"></style>

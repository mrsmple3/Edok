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
      <DocumentTable v-for="(invoice, index) in props.paginatedDocuments" :key="index" :invoice="invoice" />
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
</script>

<style scoped lang="scss">
.table-header {
  width: 100%;
  height: size(80px);
}
</style>

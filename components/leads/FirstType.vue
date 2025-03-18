<template>
  <Table class="w-full">
    <TableHeader class="w-full h-[80px]">
      <TableRow class="border-none">
        <TableHead class="t-head">
          Название документа
        </TableHead>
        <TableHead class="t-head">Тип сделки
        </TableHead>
        <TableHead class="t-head">Количество ст...
        </TableHead>
        <TableHead class="t-head">Документов
        </TableHead>
        <TableHead class="t-head">Модераторы
        </TableHead>
        <TableHead class="t-head">Дата создания
        </TableHead>
        <TableHead class="t-head">Контрагенты
        </TableHead>
        <TableHead class="t-head">Автор</TableHead>
      </TableRow>
    </TableHeader>
    <DocumentViewer v-if="documentView" :document-url="documentUrl"/>
    <TableBody class="w-full">
      <TableRow v-for="(invoice, index) in invoices" :key="invoice.id" class="hover:bg-[#2d9cdb]/20" @click="openDocument(invoice)">
<!--        @click="chatState = true"-->
          <TableCell class="flex-center justify-start gap-[20px] t-cell">

            <img alt="doc" class="w-[33px] h-[45px]" src="/icons/lead-doc.svg">
            <div>
              {{ invoice.documents.title.length > 23 ? invoice.documents.title.substring(0, 20) + '...' : invoice.documents.title }}
            </div>
          </TableCell>
          <TableCell class="w-[114px] t-cell">{{ invoice.type }}
          </TableCell>
          <TableCell class="w-[20px] t-cell">{{ invoice.quantity }}
          </TableCell>
          <TableCell class="t-cell">{{ invoice.documentsQuantity }}</TableCell>
          <TableCell class="t-cell">{{ invoice.moderators }}
          </TableCell>
          <TableCell class="t-cell">{{ invoice.createdAt }}</TableCell>
          <TableCell class="t-cell">{{ invoice.contragent }}
          </TableCell>
          <TableCell class="t-cell">{{ invoice.author.email }}</TableCell>
      </TableRow>
    </TableBody>
  </Table>
</template>

<script lang="ts" setup>
import type {Document, User} from "~/store/user.store";

const chatState = useState('isChat');

const documentView = useState('isDocumentView', () => false);

const documentUrl = ref('');
const openDocument = (invoice) => {
  documentUrl.value = invoice.documents.filePath;
  documentView.value = true;
}

defineProps({
  invoices: {
    type: Array as PropType<{
      id: number,
      type: string,
      quantity: number,
      documentsQuantity: number,
      moderators: string,
      createdAt: Date,
      contragent: string,
      documentsId: number,
      authorId: number,
      author: User,
      documents: Document,
    }[]>,
    required: true
  }
})
</script>

<style lang="scss" scoped>

</style>
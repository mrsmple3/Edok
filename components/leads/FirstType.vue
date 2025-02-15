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
    <TableBody class="w-full">
      <TableRow v-for="(invoice, index) in invoices" :key="index" class="hover:bg-[#2d9cdb]/20"
                @click="chatState = true">
        <TableCell class="flex-center justify-start gap-[20px] t-cell">
          <img alt="doc" class="w-[33px] h-[45px]" src="/icons/lead-doc.svg">
          <div>
            {{ invoice.name.length > 23 ? invoice.name.substring(0, 20) + '...' : invoice.name }}
          </div>
        </TableCell>
        <TableCell class="w-[114px] t-cell">{{ invoice.type }}
        </TableCell>
        <TableCell class="w-[20px] t-cell">{{ invoice.quantity }}
        </TableCell>
        <TableCell class="t-cell">{{ invoice.docs }}</TableCell>
        <TableCell class="t-cell">{{ invoice.moderators }}
        </TableCell>
        <TableCell class="t-cell">{{ invoice.data }}</TableCell>
        <TableCell class="t-cell">{{ invoice.contragents }}
        </TableCell>
        <TableCell class="t-cell">{{ invoice.author }}</TableCell>
      </TableRow>
    </TableBody>
  </Table>

</template>

<script lang="ts" setup>
const chatState = useState('isChat');

defineProps({
  invoices: {
    type: Array as PropType<{
      name: string,
      type: string,
      quantity: string,
      docs: string,
      moderators: string,
      data: string,
      contragents: string,
      author: string
    }[]>,
    required: true
  }
})
</script>

<style lang="scss" scoped>

</style>
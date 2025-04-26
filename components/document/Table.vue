<template>
  <TableRow class="relative hover:bg-[#2d9cdb]/20"
    :class="{ 'opacity-50 pointer-events-none': invoice.deleteSignCount !== 0 }">
    <TableCell class="w-max flex-center gap-[20px]">
      <img alt="doc" class="w-[33px] h-[45px]" src="/icons/lead-doc.svg" />
      <div class="w-max flex flex-col items-start">
        <span class="text-[#494949] text-[15px] font-medium font-['Barlow']">{{ invoice.title.length > 23 ?
          invoice.title.substring(0, 33) + "..." : invoice.title }}</span>
        <span class="text-[#898989] text-[15px] font-['Barlow']">{{ invoice.type }}</span>
        <span class="text-[#404040] text-[11px] font-['Barlow']">{{ invoice.user.name }}</span>
      </div>
    </TableCell>
    <TableCell class="t-cell">{{ invoice.lead ? invoice.lead.name : "Еще не создано" }}</TableCell>
    <TableCell class="t-cell">{{ getInfoCounterparty(invoice) }}</TableCell>
    <TableCell class="t-cell">{{ new Date(invoice.createdAt).toLocaleDateString("ru-RU") }}</TableCell>
    <TableCell class="t-cell">{{ invoice.status }}</TableCell>
    <TableCell class="t-cell">
      <div
        class="w-[49.59px] h-[50px] justify-self-center bg-[#2d9cdb]/20 flex items-center justify-center rounded-full text-[#2d9cdb] text-[25px] font-bold font-['Barlow']">
        1</div>
    </TableCell>
    <DocumentDropDown :invoice="invoice" :class="{ 'opacity-50 pointer-events-none': invoice.deleteSignCount !== 0 }" />
  </TableRow>
</template>

<script setup lang="ts">
import type { Document } from '~/store/user.store';

defineProps({
  invoice: {
    type: Object as PropType<Document>,
    required: true,
  },
});


const getInfoCounterparty = (invoice: any) => {
  if (invoice.counterparty) {
    if (invoice.counterparty.organization_name) {
      return invoice.counterparty.organization_name
    } else if (invoice.counterparty.email) {
      return invoice.counterparty.email
    } else if (invoice.counterparty.phone) {
      return invoice.counterparty.phone
    }
  } else {
    return "Не выбран"
  }
}
</script>

<style scoped lang="scss"></style>

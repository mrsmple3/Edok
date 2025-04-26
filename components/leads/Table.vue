<template>
  <TableRow class="relative hover:bg-[#2d9cdb]/20">
    <TableCell class="flex-center justify-start gap-[20px] t-cell">
      <img alt="doc" class="w-[33px] h-[45px]" src="/icons/lead-doc.svg" />
      <div class="text-start">
        {{ invoice.name.length > 23 ? invoice.name.substring(0, 20) + "..." : invoice.name }}
      </div>
    </TableCell>
    <TableCell class="w-[114px] t-cell">{{ invoice.type }} </TableCell>
    <TableCell class="t-cell">{{ invoice.documents && invoice.documents.length }}</TableCell>
    <TableCell class="t-cell">{{ invoice.moderators ? invoice.moderators.name : "Не выбрано" }} </TableCell>
    <TableCell class="t-cell">{{ new Date(invoice.createdAt).toLocaleDateString("ru-RU") }}</TableCell>
    <TableCell class="t-cell">{{ invoice.counterparty ? invoice.counterparty.organization_name : "Не выбран" }}
    </TableCell>
    <TableCell class="t-cell">{{ invoice.author.email }}</TableCell>
    <LeadsDropDown :invoice="invoice" />
  </TableRow>
</template>

<script setup lang="ts">
import type { Lead } from '~/store/user.store';

defineProps({
  invoice: {
    type: Object as PropType<Lead>,
    required: true,
  },
});
</script>

<style scoped lang="scss"></style>

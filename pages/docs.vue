<template>
  <div class="page-container">
    <div class="w-full flex-center justify-between mb-[18px]">
      <div class="flex-center">
        <h2 class="page__title mr-[32px]">Документи</h2>

        <button
            class="submenu-parent relative flex-center gap-[11px] rounded-[14px] border border-[#2d9cdb] py-2 px-7 text-[#2d9cdb] text-[18px] font-bold font-['Barlow'] mr-[24px] hover:active">
          <img alt="plus" class="w-[19px] h-[19px]" src="/icons/plus-blue.svg">
          Добавить соглашение
          <div class="submenu">
            <span>Добавить спецификацию</span>
            <span>Добавить счет</span>
            <span>Добавить накладную</span>
            <span>Добавить подтверждающие документы</span>
          </div>
        </button>

        <div class="flex-center gap-6">
          <img alt="list" class="max-w-[24px] max-h-[24px] min-h-max min-w-max cursor-pointer"
               src="/icons/leads-icon-list-1.svg">
          <img alt="list" class="max-w-[24px] max-h-[24px] min-h-max min-w-max cursor-pointer"
               src="/icons/leads-icon-list-2.svg">
          <img alt="list" class="max-w-[24px] max-h-[24px] min-h-max min-w-max cursor-pointer"
               src="/icons/leads-icon-list-3.svg">
          <img alt="list" class="max-w-[24px] max-h-[24px] min-h-max min-w-max cursor-pointer"
               src="/icons/leads-icon-list-4.svg">
          <img alt="list" class="max-w-[24px] max-h-[24px] min-h-max min-w-max cursor-pointer"
               src="/icons/leads-icon-list-5.svg">
        </div>
      </div>

      <div class="flex-center gap-[15px]">
        <Badge class="w-12 h-12  bg-[#2d9cdb]/20 rounded-[15px]  hover:bg-[#2d9cdb]/30">
          <img alt="filter" src="/icons/filter.svg">
        </Badge>
        <Badge class="w-12 h-12  bg-[#2d9cdb]/20 rounded-[15px]  hover:bg-[#2d9cdb]/30">
          <img alt="filter" src="/icons/restar.svg">
        </Badge>
      </div>
    </div>
    <div class="flex-center gap-[5px] mb-[26px]">
      <NuxtLink class="breadcrumbs" to="">Документи</NuxtLink>
    </div>
    <div class="page__block  pt-[40px] px-[42px]">
      <Table class="w-full">
        <TableHeader class="w-full h-[80px]">
          <TableRow class="border-none">
            <TableHead class="t-head">
              Название документа
            </TableHead>
            <TableHead class="t-head">Угода
            </TableHead>
            <TableHead class="t-head">Контрагент
            </TableHead>
            <TableHead class="t-head">Загружено
            </TableHead>
            <TableHead class="t-head">Состояние
            </TableHead>
            <TableHead class="t-head">Согласующие
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody class="w-full">
          <TableRow v-for="(invoice, index) in invoices" :key="index" class="hover:bg-[#2d9cdb]/20">
            <TableCell class="w-max flex-center gap-[20px]">
              <img alt="doc" class="w-[33px] h-[45px]" src="/icons/lead-doc.svg">
              <div class="w-max flex flex-col items-start">
                <span class="text-[#494949] text-[15px] font-medium font-['Barlow']">{{
                    invoice.name.length > 23 ? invoice.name.substring(0, 33) + '...' : invoice.name
                  }}</span>
                <span
                    class="text-[#898989] text-[15px] font-['Barlow']">Для информации Подтверждающие</span>
                <span
                    class="text-[#404040] text-[11px] font-['Barlow']">Шевченко Людмила Николаевна</span>
              </div>
            </TableCell>
            <TableCell class="w-[250px] t-cell">{{ invoice.lead }}</TableCell>
            <TableCell class="t-cell">{{ invoice.contragents }}</TableCell>
            <TableCell class="t-cell">{{ invoice.data }}</TableCell>
            <TableCell class="t-cell">{{ invoice.state }}</TableCell>
            <TableCell class="t-cell">
              <div
                  class="w-[49.59px] h-[50px] justify-self-center bg-[#2d9cdb]/20 flex items-center justify-center rounded-full text-[#2d9cdb] text-[25px] font-bold font-['Barlow']">
                {{ invoice.concordants }}
              </div>
            </TableCell>
          </TableRow>
        </TableBody>
      </Table>
    </div>
  </div>
</template>

<script lang="ts" setup>
definePageMeta({
  layout: 'page',
});
const invoices = [
  {
    name: '2100359852 Commodity - Corn - DAP ЧЕРНОМОРСКАЯ - ХЮРРЕМ ООО (38852547)',
    data: '06.12.2024',
    contragents: 'ТОВ "АТ Каргілл"\n' + '20010397',
    lead: '2100359852 Commodity - Corn - DAP ЧОРНОМОРСЬКА - ХЮРРЕМ ТОВ (38852547)',
    state: 'Информационный',
    concordants: '1',
  },
]
</script>


<style lang="scss" scoped>
</style>
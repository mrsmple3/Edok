<template>
  <Table class="w-full">
    <TableHeader class="w-full h-[80px]">
      <TableRow class="border-none">
        <TableHead class="t-head">
          <Checkbox :checked="isAllActive" class="bg-[#FFFFFF] border-[#DBDBDB]" @update:checked="isAllActive = !isAllActive"/>
        </TableHead>
        <TableHead class="t-head">
          Название
        </TableHead>
        <TableHead class="t-head">Код
        </TableHead>
        <TableHead class="t-head">Стан контакту
        </TableHead>
        <TableHead class="t-head">Електронна адреса
        </TableHead>
        <TableHead class="t-head">Телефон
        </TableHead>
        <TableHead class="t-head">Активність
        </TableHead>
      </TableRow>
    </TableHeader>
    <TableBody class="w-full">
      <TableRow v-for="(invoice, index) in tableData" :key="index" class="hover:bg-[#2d9cdb]/20">
        <TableCell class="px-2 w-5">
          <Checkbox :checked="invoice.isActive" class="bg-[#FFFFFF] border-[#DBDBDB]"
                    @update:checked="invoice.isActive = !invoice.isActive"/>
        </TableCell>
        <TableCell class="w-[300px] t-cell text-[17px]">{{ invoice.name }}</TableCell>
        <TableCell class="t-cell">{{ invoice.code }}</TableCell>
        <TableCell class="t-cell">{{ invoice.status }}</TableCell>
        <TableCell class="t-cell">{{ invoice.email }}</TableCell>
        <TableCell class="t-cell">{{ invoice.phone }}</TableCell>
        <TableCell class="t-cell">{{ invoice.date }}</TableCell>
      </TableRow>
    </TableBody>
  </Table>
</template>

<script lang="ts" setup>
const props = defineProps({
  tableData: {
    type: Array as PropType<{
      name: string,
      code: string,
      status: string,
      email: string,
      phone: string,
      date: string,
      isActive: boolean
    }[]>,
    required: true
  }
});

const isAllActive = ref(false);

// const allActive = () => {
//   props.tableData.forEach((item: any) => {
//     item.isActive = !item.isActive;
//   });
//
//   isAllActive.value = !isAllActive.value;
// }
</script>


<style lang="scss" scoped>

</style>
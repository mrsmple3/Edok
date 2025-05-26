<template>
  <TableRow class="relative hover:bg-[#2d9cdb]/20"
    :class="{ 'opacity-50 pointer-events-none': invoice.deleteSignCount !== 0 && invoice.deleteSigns.find(sign => sign.userId === userStore.userGetter.id), 'bg-[#d3d3d3]': invoice.type === 'Подписанный' }">
    <div class="doc-select" v-if="!invoice.leadId">
      <Checkbox :checked="checkBox" class="bg-[#FFFFFF] border-[#939393] absolute top-1/2 -translate-y-1/2 z-[10]"
        @update:checked="updateCheckbox" />
    </div>
    <div class="status" v-if="invoice.status === 'Подписан' && invoice.type !== 'Подписанный'">
      {{ invoice.status }}
    </div>
    <TableCell class="w-max flex-center gap-[20px] pl-5">
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
    <TableCell class="t-cell">{{ invoice.user.email || invoice.user.organization_name }}</TableCell>
    <TableCell class="t-cell">
      <div
        class="w-[49.59px] h-[50px] justify-self-center bg-[#2d9cdb]/20 flex items-center justify-center rounded-full text-[#2d9cdb] text-[25px] font-bold font-['Barlow']">
        1</div>
    </TableCell>
    <DocumentDropDown :invoice="invoice"
      :class="{ 'opacity-50 pointer-events-none': invoice.deleteSignCount !== 0 && invoice.deleteSigns.find(sign => sign.userId === userStore.userGetter.id) }" />
  </TableRow>
</template>

<script setup lang="ts">
import { useUserStore, type Document } from '~/store/user.store';

const props = defineProps({
  invoice: {
    type: Object as PropType<Document>,
    required: true,
  },
});

const userStore = useUserStore();

const checkBox = ref(false);

const documentsToLeads = useState('documentsToLeads', () => []);

const updateCheckbox = () => {
  const idx = documentsToLeads.value.findIndex(doc => doc.id === props.invoice.id);
  if (idx === -1) {
    checkBox.value = true;
    documentsToLeads.value.push({
      id: props.invoice.id
    });
  } else {
    checkBox.value = false;
    documentsToLeads.value.splice(idx, 1);
  }
};



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

<style scoped lang="scss">
.status {
  position: absolute;
  padding: 1px 5px;
  background: #5a5a5a;
  border-radius: 10px;
  top: -3px;
  right: 0;
  z-index: 10;
  font-size: 9px;
  color: white;
}

.doc-select {
  position: absolute;
  top: 50%;
  left: 0;
  transform: translateY(-50%);
  z-index: 10;
}
</style>

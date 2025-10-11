<template>
  <TableRow class="relative hover:bg-[#2d9cdb]/20" :class="{
    'opacity-50': invoice.deleteSignCount !== 0,
    'pointer-events-none': (invoice.deleteSigns.find(sign => sign.userId === userStore.userGetter.id)) && (userStore.$state.user.role !== 'admin' && userStore.$state.user.role !== 'boogalter' && !userStore.$state.user.canDeleterDocuments),
  }">
    <div class="doc-select" v-if="!invoice.leadId && route.name === 'user-docs'">
      <Checkbox :checked="checkBox" class="bg-[#FFFFFF] border-[#939393] absolute top-1/2 -translate-y-1/2 z-[10]"
        @update:checked="updateCheckbox" />
    </div>
    <div class="status" v-if="invoice.status === 'Підписано'">
      {{ invoice.status }}
    </div>
    <TableCell class="document-cell">
      <img alt="doc" class="document-icon" src="/icons/lead-doc.svg" />
      <div class="w-max flex flex-col items-start">
        <span class="document-title">{{ invoice.title.length > 23 ?
          invoice.title.substring(0, 33) + "..." : invoice.title }}</span>
        <span class="document-type">{{ invoice.type }}</span>
        <span class="document-author">{{ invoice.user.name }}</span>
      </div>
    </TableCell>
    <TableCell class="t-cell">{{ invoice.lead ? invoice.lead.name : "Ще не створено" }}</TableCell>
    <TableCell class="t-cell">{{ getInfoCounterparty(invoice) }}</TableCell>
    <TableCell class="t-cell">{{ new Date(invoice.createdAt).toLocaleDateString("uk-UA") }}</TableCell>
    <TableCell class="t-cell">{{ invoice.user.email || invoice.user.organization_name }}</TableCell>
    <TableCell class="t-cell">
      <div class="signature-badge">
        1</div>
    </TableCell>
    <DocumentDropDown :invoice="invoice" :class="{
      'opacity-50': invoice.deleteSignCount !== 0,
      'pointer-events-none': (userStore.$state.user.role !== 'admin' && userStore.$state.user.role !== 'boogalter' && !userStore.$state.user.canDeleterDocuments) && (invoice.deleteSigns.find(sign => sign.userId === userStore.userGetter.id)),
    }" />
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

const route = useRoute();

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

onMounted(() => {
  console.log((props.invoice.deleteSigns.find(sign => sign.userId === userStore.userGetter.id)) && (userStore.$state.user.role !== 'admin' || userStore.$state.user.role !== 'boogalter' || !userStore.$state.user.canDeleterDocuments))
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

<style scoped lang="scss">
/* Основные элементы таблицы */
.document-cell {
  width: max-content;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: size(20px);
  padding-left: size(20px);
}

.document-icon {
  width: size(33px);
  height: size(45px);
}

.document-title {
  color: #494949;
  font-size: size(15px);
  font-weight: 500;
  font-family: 'Barlow', sans-serif;
}

.document-type {
  color: #898989;
  font-size: size(15px);
  font-family: 'Barlow', sans-serif;
}

.document-author {
  color: #404040;
  font-size: size(11px);
  font-family: 'Barlow', sans-serif;
}

.signature-badge {
  width: size(50px);
  height: size(50px);
  justify-self: center;
  background-color: rgba(45, 156, 219, 0.2);
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  color: #2d9cdb;
  font-size: size(25px);
  font-weight: bold;
  font-family: 'Barlow', sans-serif;
}

.status {
  position: absolute;
  padding: size(1px) size(5px);
  background: #5a5a5a;
  border-radius: size(10px);
  top: size(-3px);
  right: 0;
  z-index: 10;
  font-size: size(9px);
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

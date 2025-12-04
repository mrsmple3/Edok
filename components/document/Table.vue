<template>
  <TableRow class="relative hover:bg-[#2d9cdb]/20" :class="{
    'opacity-50': invoice.deleteSignCount !== 0,
    'pointer-events-none': (invoice.deleteSigns.find((sign: any) => sign.userId === userStore.userGetter.id)) && (userStore.$state.user.role !== 'admin' && userStore.$state.user.role !== 'boogalter' && !userStore.$state.user.canDeleterDocuments),
  }">
    <div class="doc-select" v-if="!invoice.leadId && route.name === 'user-docs'">
      <Checkbox :checked="checkBox" class="bg-[#FFFFFF] border-[#939393] absolute top-1/2 -translate-y-1/2 z-[10]"
        @update:checked="updateCheckbox" />
    </div>
    <!-- <div class="status" v-if="invoice.status === 'Підписано'">
      {{ invoice.status }}
    </div> -->

    <!-- Назва -->
    <TableCell class="document-cell">
      <img alt="doc" class="document-icon" src="/icons/lead-doc.svg" />
      <div class="w-max flex flex-col items-start">
        <span class="document-title">{{ invoice.title.length > 30 ?
          invoice.title.substring(0, 30) + "..." : invoice.title }}</span>
      </div>
    </TableCell>

    <!-- № -->
    <TableCell class="t-cell">{{ getDocumentNumber(invoice) }}</TableCell>

    <!-- Дата документа -->
    <TableCell class="t-cell">{{ new Date(invoice.createdAt).toLocaleDateString("uk-UA") }}</TableCell>

    <!-- Тип -->
    <TableCell class="t-cell">{{ invoice.type }}</TableCell>

    <!-- Статус -->
    <TableCell class="t-cell">
      <span :class="getStatusClass(invoice)">{{ getStatusText(invoice) }}</span>
    </TableCell>

    <!-- Відправник -->
    <TableCell class="t-cell">{{ getSenderInfo(invoice) }}</TableCell>

    <!-- Автор -->
    <TableCell class="t-cell">{{ getAuthorInfo(invoice) }}</TableCell>

    <!-- Сторони -->
    <TableCell class="t-cell signatures-cell">
      <div class="signatures-list">
        <div v-if="invoice.Signature && invoice.Signature.length > 0">
          <div v-for="(signature, index) in invoice.Signature" :key="signature.id || index" class="signature-item">
            {{ getSignatureName(signature) }}
          </div>
        </div>
        <div v-else class="no-signatures">
          Не підписано
        </div>
      </div>
    </TableCell>

    <DocumentDropDown :invoice="invoice" :class="{
      'opacity-50': invoice.deleteSignCount !== 0,
      'pointer-events-none': (userStore.$state.user.role !== 'admin' && userStore.$state.user.role !== 'boogalter' && !userStore.$state.user.canDeleterDocuments) && (invoice.deleteSigns.find((sign: any) => sign.userId === userStore.userGetter.id)),
    }" />
  </TableRow>
</template>

<script setup lang="ts">
import { useUserStore, type Document } from "~/store/user.store"
import { documentRequiresSignature, getDocumentStatusLabel } from "~/lib/documents"

const props = defineProps({
  invoice: {
    type: Object,
    required: true,
  },
});

const userStore = useUserStore();
const checkBox = ref(false);

const route = useRoute();

const documentsToLeads = useState('documentsToLeads', () => []);

const updateCheckbox = () => {
  const idx = documentsToLeads.value.findIndex((doc: any) => doc.id === props.invoice.id);
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
  console.log((props.invoice.deleteSigns.find((sign: any) => sign.userId === userStore.userGetter.id)) && (userStore.$state.user.role !== 'admin' || userStore.$state.user.role !== 'boogalter' || !userStore.$state.user.canDeleterDocuments))
});

// Получение номера документа
const getDocumentNumber = (invoice: any) => {
  return invoice.id?.toString();
};

// Получение класса для статуса
const getStatusClass = (invoice: any) => {
  if (!documentRequiresSignature(invoice?.type)) {
    return 'px-2 py-1 text-xs rounded-full bg-blue-100 text-blue-800';
  }

  switch (invoice.status) {
    case 'Підписано':
      return 'px-2 py-1 text-xs rounded-full bg-green-100 text-green-800';
    case 'В очікуванні':
      return 'px-2 py-1 text-xs rounded-full bg-yellow-100 text-yellow-800';
    case 'Відхилено':
      return 'px-2 py-1 text-xs rounded-full bg-red-100 text-red-800';
    default:
      return 'px-2 py-1 text-xs rounded-full bg-gray-100 text-gray-800';
  }
};

const getStatusText = (invoice: any) => {
  return getDocumentStatusLabel(invoice?.status, invoice?.type);
};

// Получение информации об отправителе
const getSenderInfo = (invoice: any) => {
  const user = invoice.user;
  if (!user) return '-';

  return user.organization_name || user.name || user.email || '-';
};

// Получение информации об авторе
const getAuthorInfo = (invoice: any) => {
  const lead = invoice.lead;
  if (lead && lead.authorId) {
    // Можно добавить логику для получения автора договора
    return 'Автор договору';
  }
  return getSenderInfo(invoice);
};

// Получение имени подписанта
const getSignatureName = (signature: any) => {
  // Сначала проверяем данные пользователя системы
  if (signature.User) {
    const userName = signature.User.organization_name || signature.User.name || signature.User.email;
    if (userName) {
      return userName;
    }
  }

  // Попытка извлечь имя из сертификата
  if (signature.info) {
    try {
      const info = signature.info;

      // Нормализуем текст
      const normalized = info.replace(/\\n/g, "\n");
      const lines = normalized.split("\n").map((line: string) => line.trim()).filter((line: string) => line);

      // Ищем строку Subject
      for (const line of lines) {
        if (line.includes(":")) {
          const [key, ...valueParts] = line.split(":");
          const value = valueParts.join(":").trim();

          if (key && value && key.trim() === 'Subject') {
            // Парсим Subject данные
            const subjectData = parseSubjectFromLine(value);
            if (subjectData && subjectData !== 'Невідомий') {
              return subjectData;
            }
          }
        }
      }

      // Если не нашли через Subject, попробуем прямой поиск CN
      const directCNMatch = info.match(/CN=([^,\n]+)/);
      if (directCNMatch) {
        const name = decodeHexString(directCNMatch[1].trim());
        if (name && name !== 'Невідомий') {
          return name;
        }
      }

    } catch (error) {
      console.error('Ошибка парсинга сертификата:', error);
    }
  }

  return 'Невідомий';
};

// Функция для парсинга Subject строки
const parseSubjectFromLine = (subjectLine: string): string => {
  try {
    // Ищем CN (Common Name) в Subject
    const cnMatch = subjectLine.match(/CN=([^,]+)/);
    if (cnMatch) {
      let name = cnMatch[1].trim();

      // Убираем кавычки если есть
      if (name.startsWith('"') && name.endsWith('"')) {
        name = name.slice(1, -1);
      }

      // Декодируем hex если есть
      name = decodeHexString(name);

      // Проверяем, что получили валидное имя
      if (name && name !== 'Невідомий' && name.length > 0) {
        return name;
      }
    }

    // Если CN не дал результата, попробуем O (организация)
    const oMatch = subjectLine.match(/O=([^,]+)/);
    if (oMatch) {
      let orgName = oMatch[1].trim();

      // Убираем кавычки если есть
      if (orgName.startsWith('"') && orgName.endsWith('"')) {
        orgName = orgName.slice(1, -1);
      }

      // Декодируем hex если есть
      orgName = decodeHexString(orgName);

      // Проверяем, что получили валидное имя и это не стандартная фраза
      if (orgName && orgName !== 'Невідомий' && orgName !== 'ФІЗИЧНА ОСОБА' && orgName.length > 0) {
        return orgName;
      }
    }

  } catch (error) {
    console.error('Ошибка парсинга Subject:', error);
  }
  return 'Невідомий';
};

// Функция для декодирования hex-encoded строк (из Protocol.vue)
const decodeHexString = (hexStr: string): string => {
  try {
    if (!hexStr) return '';

    // Убираем экранирующие символы и декодируем hex
    const cleaned = hexStr.replace(/\\x([0-9A-Fa-f]{2})/g, (_match: string, hex: string) => {
      return String.fromCharCode(parseInt(hex, 16));
    });

    // Если строка содержала hex-кодирование, декодируем UTF-8
    if (hexStr.includes('\\x')) {
      try {
        const bytes = new Uint8Array([...cleaned].map(char => char.charCodeAt(0)));
        return new TextDecoder('utf-8').decode(bytes);
      } catch (utfError) {
        return cleaned;
      }
    }

    return cleaned;
  } catch (error) {
    return hexStr || '';
  }
}; const getInfoCounterparty = (invoice: any) => {
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
  min-width: max-content;
  min-height: max-content;
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

.document-cell {
  display: flex;
  align-items: center;
  gap: 8px;
}

.document-title {
  font-weight: 500;
  color: #374151;
}

.signature-list {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.signature-item {
  font-size: 12px;
  color: #374151;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 150px;
  line-height: 1.3;
}

.no-signatures {
  font-size: 12px;
  color: #9ca3af;
  font-style: italic;
}

.signatures-cell {
  max-width: 150px;
  vertical-align: top;
}

.signature-name:not(:last-child)::after {
  content: ',';
}
</style>

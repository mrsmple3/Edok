<template>
  <Dialog v-model:open="isDialogOpen">
    <DialogTrigger>
      Протокол
    </DialogTrigger>
    <DialogContent class="!max-w-[80vw] !w-[80vw] h-[75vh]">
      <DialogHeader>
        <DialogTitle>Протоколы</DialogTitle>
        <DialogDescription>
          Дані підписів
        </DialogDescription>
        <div class="w-full h-[500px] overflow-auto flex flex-col items-start gap-3 mt-4">
          <!-- Если нет подписей -->
          <div v-if="!props.invoice.Signature || props.invoice.Signature.length === 0"
            class="w-full text-center text-gray-500 py-8">
            Підписи відсутні
          </div>

          <!-- Отображаем все подписи -->
          <div v-else v-for="(signature, index) in props.invoice.Signature" :key="index"
            class="w-full border rounded-lg">

            <!-- Заголовок аккордеона -->
            <button @click="toggleSignature(index)"
              class="w-full px-4 py-3 bg-gray-50 hover:bg-gray-100 border-b flex items-center justify-between transition-colors duration-200">
              <div class="flex items-center gap-3">
                <span class="font-semibold text-gray-700">Підпис #{{ index + 1 }}</span>
                <span v-if="signature.createdAt" class="text-sm text-gray-500">
                  {{ formatDate(signature.createdAt) }}
                </span>
              </div>

              <!-- Иконка стрелки -->
              <svg :class="{ 'rotate-180': openSignatures[index] }"
                class="w-5 h-5 text-gray-500 transition-transform duration-200" fill="none" stroke="currentColor"
                viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"></path>
              </svg>
            </button>

            <!-- Содержимое аккордеона -->
            <div v-show="openSignatures[index]" class="px-4 py-3 bg-white">
              <!-- Если есть info -->
              <div v-if="signature.info">
                <div class="space-y-2">
                  <div v-for="(line, lineIndex) in getFormattedInfo(signature.info)" :key="lineIndex"
                    class="flex items-start justify-between py-1 border-b border-gray-100 last:border-b-0">
                    <strong class="text-sm text-gray-600 w-1/3 pr-2">{{ line.key }}</strong>
                    <span class="text-sm text-gray-800 w-2/3 text-right whitespace-pre-wrap break-words">{{ line.value
                    }}</span>
                  </div>
                </div>
              </div>

              <!-- Дополнительная информация о подписи -->
              <div class="mt-4 pt-3 border-t border-gray-200">
                <div class="grid grid-cols-2 gap-4 text-sm">
                  <div v-if="signature.User">
                    <span class="text-gray-600">Користувач:</span>
                    <span class="ml-2 font-medium">{{ signature.User.name }}</span>
                  </div>

                  <div v-if="signature.signature">
                    <span class="text-gray-600">Файл підпису:</span>
                    <a :href="signature.signature" target="_blank"
                      class="ml-2 text-blue-600 hover:text-blue-800 underline">
                      Завантажити
                    </a>
                  </div>

                  <div v-if="signature.stampedFile">
                    <span class="text-gray-600">Підписаний документ:</span>
                    <a :href="signature.stampedFile" target="_blank"
                      class="ml-2 text-blue-600 hover:text-blue-800 underline">
                      Переглянути
                    </a>
                  </div>

                  <div v-if="signature.createdAt">
                    <span class="text-gray-600">Дата підпису:</span>
                    <span class="ml-2">{{ formatFullDate(signature.createdAt) }}</span>
                  </div>
                </div>
              </div>

              <!-- Если нет info -->
              <div v-if="!signature.info" class="text-gray-500 italic py-4 text-center">
                Інформація про сертифікат відсутня
              </div>
            </div>
          </div>
        </div>
      </DialogHeader>
    </DialogContent>
  </Dialog>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';

const props = defineProps({
  invoice: {
    type: Object,
    required: true,
  },
});

const isDialogOpen = ref(false);

// Состояние для отслеживания открытых аккордеонов
const openSignatures = ref<{ [key: number]: boolean }>({});

// Функция для переключения состояния аккордеона
function toggleSignature(index: number) {
  openSignatures.value[index] = !openSignatures.value[index];
}

// Функция для декодирования UTF-8 hex
function decodeUtf8Hex(str: string) {
  try {
    return decodeURIComponent(
      str.replace(/\\x/g, "%")
    );
  } catch {
    return str;
  }
}

// Функция для форматирования info конкретной подписи
function getFormattedInfo(info: string) {
  if (!info) return [];

  // 1. Заменим `\n` на настоящие переводы строк
  const normalized = info.replace(/\\n/g, "\n");

  // 2. Разбиваем на строки
  const lines = normalized.split("\n");

  // 3. Собираем ключи и значения
  const parsed = lines
    .map(line => line.trim())
    .filter(line => line.includes(":"))
    .map(line => {
      const [key, ...rest] = line.split(":");
      const value = rest.join(":").trim();
      return {
        key: decodeUtf8Hex(key.trim()),
        value: decodeUtf8Hex(value)
      };
    });

  return parsed;
}

// Функция для форматирования краткой даты
function formatDate(dateString: string) {
  try {
    const date = new Date(dateString);
    return date.toLocaleDateString('uk-UA', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  } catch {
    return dateString;
  }
}

// Функция для форматирования полной даты и времени
function formatFullDate(dateString: string) {
  try {
    const date = new Date(dateString);
    return date.toLocaleDateString('uk-UA', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  } catch {
    return dateString;
  }
}
</script>

<style scoped>
/* Дополнительные стили для лучшего отображения */
.rotate-180 {
  transform: rotate(180deg);
}
</style>

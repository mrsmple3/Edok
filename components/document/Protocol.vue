<template>
  <Dialog v-model:open="isDialogOpen">
    <DialogTrigger>
      Протокол
    </DialogTrigger>
    <DialogContent class="!max-w-[90vw] !w-[90vw] h-[80vh]">
      <DialogHeader>
        <DialogTitle class="text-xl font-bold">Протокол електронних підписів</DialogTitle>
        <DialogDescription class="flex items-center justify-between">
          <span>Документ: {{ props.invoice.title || 'Без назви' }}</span>

          <!-- Кнопка скачивания всех протоколов -->
          <button v-if="props.invoice.Signature && props.invoice.Signature.length > 0" @click="downloadAllProtocolsPDF"
            class="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white text-sm font-medium rounded-lg transition-colors duration-200"
            :disabled="isGeneratingAllPDF">
            <svg v-if="!isGeneratingAllPDF" class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <svg v-else class="w-4 h-4 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            {{ isGeneratingAllPDF ? 'Генерація всіх...' : 'Скачати всі протоколи' }}
          </button>
        </DialogDescription>

        <div class="w-full h-[600px] overflow-auto flex flex-col items-start gap-4 mt-6">
          <!-- Если нет подписей -->
          <div v-if="!props.invoice.Signature || props.invoice.Signature.length === 0"
            class="w-full text-center text-gray-500 py-12 border-2 border-dashed border-gray-300 rounded-lg">
            <svg class="mx-auto h-12 w-12 text-gray-400 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0   01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <p class="text-lg font-medium">Підписи відсутні</p>
            <p class="text-sm text-gray-400">Документ ще не було підписано</p>
          </div>

          <!-- Отображаем все подписи -->
          <div v-else v-for="(signature, index) in sortedSignatures" :key="signature.id || index"
            class="w-full border-2 rounded-xl shadow-sm hover:shadow-md transition-shadow duration-200">

            <!-- Заголовок протокола -->
            <div class="px-6 py-4 bg-gradient-to-r from-blue-50 to-indigo-50 border-b-2 border-blue-100 rounded-t-xl">
              <div class="flex items-center justify-between">
                <div class="flex items-center gap-4">
                  <div class="flex items-center gap-2">
                    <div
                      class="w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold text-sm">
                      {{ index + 1 }}
                    </div>
                    <h3 class="text-lg font-bold text-gray-800">Протокол підпису №{{ index + 1 }}</h3>
                  </div>
                  <div class="flex items-center gap-2">
                    <span class="px-3 py-1 bg-green-100 text-green-800 text-xs font-medium rounded-full">
                      Підписано
                    </span>
                    <span v-if="signature.createdAt"
                      class="px-3 py-1 bg-blue-100 text-blue-800 text-xs font-medium rounded-full">
                      {{ formatDate(signature.createdAt) }}
                    </span>
                  </div>
                </div>

                <div class="flex items-center gap-3">
                  <!-- Кнопка скачивания PDF -->
                  <button @click="downloadProtocolPDF(signature, index + 1)"
                    class="flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-sm font-medium rounded-lg transition-colors duration-200"
                    :disabled="isGeneratingPDF">
                    <svg v-if="!isGeneratingPDF" class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                        d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    <svg v-else class="w-4 h-4 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                        d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                    {{ isGeneratingPDF ? 'Генерація...' : 'Скачати PDF' }}
                  </button>

                  <!-- Кнопка сворачивания -->
                  <button @click="toggleSignature(index)"
                    class="p-2 hover:bg-blue-100 rounded-lg transition-colors duration-200">
                    <svg :class="{ 'rotate-180': openSignatures[index] }"
                      class="w-5 h-5 text-blue-600 transition-transform duration-200" fill="none" stroke="currentColor"
                      viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"></path>
                    </svg>
                  </button>
                </div>
              </div>
            </div>

            <!-- Содержимое протокола -->
            <div v-show="openSignatures[index]" class="px-6 py-6 bg-white rounded-b-xl">

              <!-- Основная информация о подписанте -->
              <div class="mb-6">
                <h4 class="text-md font-semibold text-gray-800 mb-4 flex items-center gap-2">
                  <svg class="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                      d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                  1. Інформація про підписанта
                </h4>
                <div class="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-gray-50 rounded-lg">
                  <div v-if="signature.User">
                    <span class="text-sm font-medium text-gray-600">Користувач системи:</span>
                    <p class="text-sm text-gray-900 font-medium">{{ signature.User.name }}</p>
                  </div>
                  <div v-if="signature.createdAt">
                    <span class="text-sm font-medium text-gray-600">Дата і час підпису:</span>
                    <p class="text-sm text-gray-900 font-medium">{{ formatFullDate(signature.createdAt) }}</p>
                  </div>
                </div>
              </div>

              <!-- Информация о сертификате -->
              <div v-if="signature.info" class="mb-6">
                <h4 class="text-md font-semibold text-gray-800 mb-4 flex items-center gap-2">
                  <svg class="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                      d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                  </svg>
                  2. Дані електронного сертифіката
                </h4>
                <div class="space-y-3">
                  <div v-for="(section, sectionIndex) in getStructuredInfo(signature.info)" :key="sectionIndex">
                    <h5 class="text-sm font-semibold text-gray-700 mb-2 pl-4 border-l-3 border-blue-400">
                      {{ section.title }}
                    </h5>
                    <div class="grid grid-cols-1 gap-2 ml-4">
                      <div v-for="(item, itemIndex) in section.items" :key="itemIndex"
                        class="flex flex-col sm:flex-row sm:items-center py-2 px-3 rounded bg-gray-50 hover:bg-gray-100 transition-colors duration-150">
                        <span class="text-xs font-medium text-gray-600 sm:w-1/3 mb-1 sm:mb-0">{{ item.key }}:</span>
                        <span class="text-sm text-gray-900 sm:w-2/3 break-words">{{ item.value }}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <!-- Файлы и ссылки -->
              <div class="mb-6">
                <h4 class="text-md font-semibold text-gray-800 mb-4 flex items-center gap-2">
                  <svg class="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                      d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  3. Файли підпису
                </h4>
                <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div v-if="signature.signature"
                    class="p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-blue-400 transition-colors duration-200">
                    <div class="flex items-center gap-3">
                      <svg class="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                          d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                      <div>
                        <p class="text-sm font-medium text-gray-900">Файл електронного підпису</p>
                        <a :href="signature.signature" target="_blank"
                          class="text-sm text-blue-600 hover:text-blue-800 underline">
                          Завантажити .p7s файл
                        </a>
                      </div>
                    </div>
                  </div>

                  <div v-if="signature.stampedFile"
                    class="p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-green-400 transition-colors duration-200">
                    <div class="flex items-center gap-3">
                      <svg class="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                          d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                      </svg>
                      <div>
                        <p class="text-sm font-medium text-gray-900">Підписаний документ</p>
                        <a :href="signature.stampedFile" target="_blank"
                          class="text-sm text-green-600 hover:text-green-800 underline">
                          Переглянути документ з печаткою
                        </a>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <!-- Если нет данных сертификата -->
              <div v-if="!signature.info" class="text-center py-8">
                <svg class="mx-auto h-12 w-12 text-gray-400 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L4.268 18.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
                <p class="text-gray-500 italic">Інформація про сертифікат відсутня або пошкоджена</p>
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
const isGeneratingPDF = ref(false);
const isGeneratingAllPDF = ref(false);

// Состояние для отслеживания открытых аккордеонов
const openSignatures = ref<{ [key: number]: boolean }>({});

// Сортированные подписи по дате
const sortedSignatures = computed(() => {
  if (!props.invoice.Signature) return [];
  return [...props.invoice.Signature].sort((a, b) => {
    return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
  });
});

// Функция для переключения состояния аккордеона
function toggleSignature(index: number) {
  openSignatures.value[index] = !openSignatures.value[index];
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

// Функция генерации PDF протокола
async function downloadProtocolPDF(signature: any, protocolNumber: number) {
  try {
    isGeneratingPDF.value = true;

    // Отправляем запрос на сервер для генерации PDF
    const response = await fetch('/api/protocol/generate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        signature,
        protocolNumber,
        documentTitle: props.invoice.title
      })
    });

    if (!response.ok) {
      throw new Error('Помилка створення PDF');
    }

    // Получаем blob из ответа
    const blob = await response.blob();

    // Создаем blob URL и скачиваем файл
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;

    const fileName = `protocol_${protocolNumber}_${formatDate(signature.createdAt || new Date().toISOString())}.pdf`;
    link.download = fileName;

    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);

  } catch (error) {
    console.error('Ошибка генерации PDF:', error);
    alert('Помилка при створенні PDF файлу');
  } finally {
    isGeneratingPDF.value = false;
  }
}

// Функция генерации PDF со всеми протоколами
async function downloadAllProtocolsPDF() {
  try {
    isGeneratingAllPDF.value = true;

    // Проверяем, есть ли подписи
    if (!props.invoice.Signature || props.invoice.Signature.length === 0) {
      alert('Немає підписів для створення протоколів');
      return;
    }

    // Отправляем запрос на сервер для генерации PDF со всеми протоколами
    const response = await fetch('/api/protocol/generate-all', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        signatures: props.invoice.Signature,
        documentTitle: props.invoice.title
      })
    });

    if (!response.ok) {
      throw new Error('Помилка створення PDF з усіма протоколами');
    }

    // Получаем blob из ответа
    const blob = await response.blob();

    // Создаем blob URL и скачиваем файл
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;

    const fileName = `protocols_all_${formatDate(new Date().toISOString())}.pdf`;
    link.download = fileName;

    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);

  } catch (error) {
    console.error('Ошибка генерации PDF со всеми протоколами:', error);
    alert('Помилка при створенні PDF файлу з усіма протоколами');
  } finally {
    isGeneratingAllPDF.value = false;
  }
}// Структурированная обработка информации о сертификате
function getStructuredInfo(info: string) {
  if (!info) return [];

  const sections: Array<{
    title: string;
    keywords: string[];
    items: Array<{ key: string; value: string }>;
  }> = [
      {
        title: 'Власник сертифіката',
        keywords: ['Subject'],
        items: []
      }
    ];

  // Нормализуем текст
  const normalized = info.replace(/\\n/g, "\n");
  const lines = normalized.split("\n").map(line => line.trim()).filter(line => line);

  // Функция для парсинга Subject строки
  function parseSubjectData(data: string): Array<{ key: string; value: string }> {
    const items: Array<{ key: string; value: string }> = [];

    try {
      // Убираем "Subject: " из начала
      const cleanData = data.replace(/^Subject:\s*/, '');

      // Разбиваем по запятым, но учитываем что внутри значений могут быть запятые
      const parts = [];
      let current = '';
      let inQuotes = false;

      for (let i = 0; i < cleanData.length; i++) {
        const char = cleanData[i];

        if (char === '"') {
          inQuotes = !inQuotes;
          current += char;
        } else if (char === ',' && !inQuotes) {
          if (current.trim()) {
            parts.push(current.trim());
          }
          current = '';
        } else {
          current += char;
        }
      }

      if (current.trim()) {
        parts.push(current.trim());
      }

      // Парсим каждую часть
      for (const part of parts) {
        if (part.includes('=')) {
          const [key, ...valueParts] = part.split('=');
          let value = valueParts.join('=').trim();

          if (key && value) {
            const cleanKey = key.trim();
            let cleanValue = decodeHexString(value);

            // Проверяем, есть ли в значении serialNumber и разделяем их
            if (cleanValue.includes('/serialNumber=')) {
              const [mainValue, serialPart] = cleanValue.split('/serialNumber=');

              // Добавляем основное значение
              const readableKey = formatCertificateFieldName(cleanKey);
              items.push({
                key: readableKey,
                value: mainValue.trim()
              });

              // Добавляем serialNumber отдельно
              if (serialPart) {
                items.push({
                  key: 'ІПН / Серійний номер',
                  value: serialPart.trim()
                });
              }
            } else {
              // Обычная обработка без serialNumber
              const readableKey = formatCertificateFieldName(cleanKey);
              items.push({
                key: readableKey,
                value: cleanValue
              });
            }
          }
        }
      }
    } catch (error) {
      console.error('Ошибка парсинга Subject:', error);
      // Fallback - просто показываем как есть
      items.push({
        key: 'Дані власника',
        value: data
      });
    }

    return items;
  }

  // Функция для декодирования hex строк (как в SignDialogWindow)
  function decodeHexString(hexStr: string): string {
    try {
      if (!hexStr) return '';

      // Убираем экранирующие символы и декодируем hex
      const cleaned = hexStr.replace(/\\x([0-9A-Fa-f]{2})/g, (match, hex) => {
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
  }

  // Парсим строки - ищем только Subject
  for (const line of lines) {
    if (line.includes(":")) {
      const [key, ...valueParts] = line.split(":");
      const value = valueParts.join(":").trim();

      if (key && value) {
        const cleanKey = key.trim();

        // Обрабатываем только Subject
        if (cleanKey === 'Subject') {
          const subjectItems = parseSubjectData(line);
          sections[0].items.push(...subjectItems);
          break; // Найден Subject, больше ничего не нужно
        }
      }
    }
  }

  // Возвращаем только секции с данными
  return sections.filter(section => section.items.length > 0);
}

// Функция для форматирования полей сертификата
function formatCertificateFieldName(fieldName: string): string {
  const certificateFieldMap: { [key: string]: string } = {
    // Основные поля
    'CN': 'Повне ім\'я / Назва організації',
    'O': 'Організація',
    'OU': 'Підрозділ організації',
    'L': 'Місто / Населений пункт',
    'ST': 'Область / Регіон',
    'C': 'Країна',

    // Персональні дані
    'SN': 'Прізвище',
    'GN': 'Ім\'я та по батькові',
    'givenName': 'Ім\'я',
    'surname': 'Прізвище',
    'title': 'Посада / Звання',

    // Ідентифікатори
    'serialNumber': 'ІПН / Серійний номер',
    'UID': 'Унікальний ідентифікатор',
    'organizationIdentifier': 'Ідентифікатор організації',

    // Адресні дані
    'street': 'Адреса (вулиця, будинок)',
    'postalCode': 'Поштовий індекс',
    'businessCategory': 'Категорія діяльності',

    // Технічні поля
    'emailAddress': 'Електронна пошта',
    'telephoneNumber': 'Номер телефону',
    'description': 'Опис'
  };

  // Проверяем точное совпадение сначала
  if (certificateFieldMap[fieldName]) {
    return certificateFieldMap[fieldName];
  }

  // Если точного совпадения нет, проверяем включение (includes)
  for (const [key, value] of Object.entries(certificateFieldMap)) {
    if (fieldName.includes(key)) {
      return value;
    }
  }

  // Если ничего не найдено, возвращаем исходное имя
  return fieldName;
}
</script>

<style scoped>
.rotate-180 {
  transform: rotate(180deg);
}

/* Анимации */
@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(-10px);
  }

  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.animate-fade-in {
  animation: fadeIn 0.3s ease-out;
}

/* Улучшенные стили для скролла */
::-webkit-scrollbar {
  width: 8px;
}

::-webkit-scrollbar-track {
  background: #f1f1f1;
  border-radius: 4px;
}

::-webkit-scrollbar-thumb {
  background: #c1c1c1;
  border-radius: 4px;
}

::-webkit-scrollbar-thumb:hover {
  background: #a8a8a8;
}
</style>

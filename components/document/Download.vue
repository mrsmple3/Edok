<template>
  <Dialog v-model:open="isDialogOpen">
    <DialogTrigger>
      Скачати
    </DialogTrigger>
    <DialogContent class="!max-w-[80vw] !w-[80vw] h-[75vh]">
      <DialogHeader>
        <DialogTitle>Документы </DialogTitle>
        <DialogDescription>
          Файли для скачування
        </DialogDescription>
        <div class="w-full flex flex-col gap-2 mt-4">
          <a v-if="props.invoice.Signature.length !== 0" :href="`/api/download/archive/${Number(props.invoice.id)}`"
            class="underline text-blue-600" download>
            📦 Скачать ZIP-архив с документами
          </a>
        </div>
        <div class="h-[400px] overflow-auto w-full flex flex-col items-start gap-3 mt-4">
          <div v-if="props.invoice.Signature[0]?.info" v-for="(line, index) in formattedInfo" :key="index"
            class="w-full flex items-center justify-between">
            <strong class="text-sm text-gray-600">{{ line.key }}</strong>
            <span class="w-1/2 text-sm text-gray-800 text-right whitespace-pre-wrap">{{ line.value }}</span>
          </div>
        </div>
      </DialogHeader>
    </DialogContent>
  </Dialog>
</template>

<script setup lang="ts">
import { useRoute } from 'vue-router';
const props = defineProps({
  invoice: {
    type: Object,
    required: true,
  },
});
const isDialogOpen = ref(false);

function decodeUtf8Hex(str: string) {
  try {
    return decodeURIComponent(
      str.replace(/\\x/g, "%")
    );
  } catch {
    return str;
  }
}

const formattedInfo = computed(() => {
  const raw = props.invoice.Signature[0]?.info || "";

  // 1. Заменим `\n` на настоящие переводы строк
  const normalized = raw.replace(/\\n/g, "\n");

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
});
</script>

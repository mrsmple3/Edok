<template>
  <Dialog v-model:open="isDialogOpen">
    <DialogTrigger>
      Скачати
    </DialogTrigger>
    <DialogContent class="dialog-content">
      <DialogHeader>
        <DialogTitle>Документы </DialogTitle>
        <DialogDescription>
          Файли для скачування
        </DialogDescription>
        <div class="download-links-container">
          <a v-if="documentDownloadUrl" :href="documentDownloadUrl" class="underline text-blue-600" download>
            📄 Завантажити документ
          </a>
          <button v-if="props.invoice.Signature && props.invoice.Signature.length !== 0"
            class="underline text-blue-600 text-left"
            :disabled="isDownloadingArchive"
            @click="downloadArchive">
            {{ isDownloadingArchive ? '⏳ Завантаження...' : '📦 Завантажити ZIP-архів із документами' }}
          </button>
        </div>
      </DialogHeader>
    </DialogContent>
  </Dialog>
</template>

<script setup lang="ts">
import { computed, ref } from "vue";
import { normalizeFileUrl } from "~/utils/fileUrl";
import { useUserStore } from "~/store/user.store";

const props = defineProps({
  invoice: {
    type: Object,
    required: true,
  },
});

const userStore = useUserStore();
const isDialogOpen = ref(false);
const isDownloadingArchive = ref(false);
const documentDownloadUrl = computed(() => normalizeFileUrl(props.invoice?.filePath));

async function downloadArchive() {
  try {
    isDownloadingArchive.value = true;
    const response = await fetch(`/api/download/archive/${Number(props.invoice.id)}`, {
      headers: { 'Authorization': `Bearer ${userStore.tokenGetter}` },
    });
    if (!response.ok) throw new Error('Download failed');
    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `document_${props.invoice.id}.zip`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  } catch {
    alert('Помилка при завантаженні архіву');
  } finally {
    isDownloadingArchive.value = false;
  }
}
</script>

<style scoped lang="scss">
.dialog-content {
  max-width: 80vw !important;
  width: 80vw !important;
  height: 75vh;
}

.download-links-container {
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: size(8px);
  margin-top: size(16px);
}
</style>

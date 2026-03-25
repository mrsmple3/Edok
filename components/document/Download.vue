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
          <a v-if="props.invoice.Signature.length !== 0" :href="`/api/download/archive/${Number(props.invoice.id)}`"
            class="underline text-blue-600" download>
            📦 Завантажити ZIP-архів із документами
          </a>
        </div>
      </DialogHeader>
    </DialogContent>
  </Dialog>
</template>

<script setup lang="ts">
import { computed } from "vue";
import { normalizeFileUrl } from "~/utils/fileUrl";

const props = defineProps({
  invoice: {
    type: Object,
    required: true,
  },
});
const isDialogOpen = ref(false);
const documentDownloadUrl = computed(() => normalizeFileUrl(props.invoice?.filePath));
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

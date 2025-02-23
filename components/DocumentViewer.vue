<template>
  <div class="document-viewer">
    <iframe class="document-frame" src="/uploads/23-02-2025/2.1 Архитектурный_документ_Этап_1-1740334982338-346621630.docx"></iframe>
  </div>
</template>

<script lang="ts" setup>
const props = defineProps<{
  documentUrl: string
}>();
</script>

<style scoped>
.document-viewer {
  width: 100%;
  height: 100%;
}

.document-frame {
  width: 100%;
  height: 100%;
  border: none;
}
</style>
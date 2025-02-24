<template>
  <div class="document-viewer">
    <iframe :src="getGoogleDocViewerUrl(docUrl)" allow="autoplay" class="document-frame"></iframe>
  </div>
</template>

<script lang="ts" setup>
const props = defineProps<{
  documentUrl: string
}>();
const docUrl = 'https://docs.google.com/document/d/1BGyxBeKzbY0leDOc6QwRAMcWXG6dwPQn/edit';
// 'http://localhost:3000/uploads/23-02-2025/2.1%20%D0%90%D1%80%D1%85%D0%B8%D1%82%D0%B5%D0%BA%D1%82%D1%83%D1%80%D0%BD%D1%8B%D0%B8%CC%86_%D0%B4%D0%BE%D0%BA%D1%83%D0%BC%D0%B5%D0%BD%D1%82_%D0%AD%D1%82%D0%B0%D0%BF_1-1740334982338-346621630.docx'
function getGoogleDocViewerUrl(url) {
  return `https://docs.google.com/viewer?url=${url}&embedded=true`
}
</script>

<style scoped>
.document-viewer {
  width: 100vw;
  height: 100vh;
}

.document-frame {
  width: 100%;
  height: 100%;
  border: none;
}
</style>
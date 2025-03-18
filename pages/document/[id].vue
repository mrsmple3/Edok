<template>
  <div>
    <DocumentViewer :documentUrl="documentUrl"/>
  </div>
</template>

<script lang="ts" setup>
const route = useRoute();
const documentUrl = ref('');

onMounted(async () => {
  const response = await $fetch(`/api/documents/convert/${route.params.id}`);
  if (response.success) {
    documentUrl.value = response.outputFilePath;
  } else {
    alert('Conversion failed');
  }
});
</script>

<style lang="scss" scoped>
</style>
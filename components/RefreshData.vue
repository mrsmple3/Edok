<template>
  <Badge @click="refreshData" class="w-12 h-12 bg-[#2d9cdb]/20 rounded-[15px] hover:bg-[#2d9cdb]/30">
    <img alt="filter" src="/icons/restar.svg" />
  </Badge>
</template>

<script setup lang="ts">
const props = defineProps({
  refreshFunction: {
    type: Function,
    required: true
  }
});

const refreshData = () => {
  props.refreshFunction();
}
</script>

<style scoped>
</style>

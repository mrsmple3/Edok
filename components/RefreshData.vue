<template>
  <Badge @click="refreshData" class="refresh-badge bg-[#2d9cdb]/20 hover:bg-[#2d9cdb]/30">
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

<style scoped lang="scss">
.refresh-badge {
  width: size(48px); // w-12 = 48px
  height: size(48px); // h-12 = 48px
  border-radius: size(15px);
}
</style>

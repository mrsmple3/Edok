<template>
  <Transition name="fade">
    <div v-if="isLoading" class="page-loader">
      <div class="loader-content">
        <div class="spinner"></div>
        <p class="loader-text">Завантаження...</p>
      </div>
    </div>
  </Transition>
</template>

<script setup lang="ts">
const { isLoading } = usePageLoader();
</script>

<style lang="scss" scoped>
.page-loader {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  background-color: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(4px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 9999;
}

.loader-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 20px;
}

.spinner {
  width: 60px;
  height: 60px;
  border: 4px solid #e5e7eb;
  border-top-color: #2d9cdb;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

.loader-text {
  color: #464154;
  font-size: 18px;
  font-weight: 500;
  font-family: 'Barlow', sans-serif;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>

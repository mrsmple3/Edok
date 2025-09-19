<template>
  <div :class="{ chat: chatState }" class="sidebar__container">
    <SideBar />
    <div class="main-content">
      <slot />
    </div>
    <ChatSidebar />
  </div>
</template>

<script lang="ts" setup>
const chatState = useState('isChat', () => false);
</script>

<style lang="scss" scoped>
.sidebar__container {
  width: 100vw;
  height: 100vh;
  max-width: 100vw;
  max-height: 100vh;
  display: grid;
  grid-template-columns: size(330px) 1fr;
  gap: size(50px);
  padding-right: size(50px);
  overflow-y: hidden;
  transition: all 0.3s;

  &.chat {
    gap: size(17px);
    grid-template-columns: size(330px) 1fr size(430px);
    padding-right: 0;
  }
}

.main-content {
  width: 100%;
  height: 100%;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
}
</style>

<template>
  <div :class="{ chat: chatState }" class="sidebar__container">
    <SideBar/>
    <slot/>
    <ChatSidebar/>
  </div>
</template>

<script lang="ts" setup>
const chatState = useState('isChat', () => false);
</script>

<style lang="scss" scoped>
.sidebar__container {
  width: 100%;
  height: 100vh;
  display: grid;
  grid-template-columns: size(300px) 1fr;
  gap: size(85px);
  padding-right: size(78px);
  overflow-y: hidden;
  transition: all 0.3s;

  &.chat {
    gap: size(17px);
    grid-template-columns: size(300px) 1fr size(409px);
    padding-right: 0;
  }
}
</style>
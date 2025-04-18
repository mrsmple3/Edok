<template>
  <div class="w-full h-full flex-col-start justify-between bg-white rounded-[14px] border border-[#2d9cdb] ">
    <div class="w-full h-full flex-col-start gap-5 pt-[18px] pb-6 px-5 overflow-y-auto">
      <ChatValue v-for="(message, index) in userStore.$state.messages" :key="index" :message="message" />
    </div>
    <div class="chat__input">
      <Input v-model="message" class="input focus-visible:!ring-0 focus-visible:!ring-offset-0"
        placeholder="Введiть повiдомлення" />
      <img alt="send" class="absolute top-1/2 -translate-y-1/2 right-[23px] w-[24px] h-[22px]" src="/icons/telegram.svg"
        @click="sendMessage" />
    </div>
  </div>
</template>

<script lang="ts" setup>
const props = defineProps({
  tabActive: {
    type: String,
    required: true,
  },
});
import { io, Socket } from 'socket.io-client';
import { useUserStore } from '~/store/user.store';

const userStore = useUserStore();
const route = useRoute();

const message = ref('');

const sendMessage = () => {
  if (message.value.trim() && userStore.$state.socket) {
    userStore.$state.socket.emit('sendMessage', message.value, userStore.userGetter, `${route.query.room}${route.query.id}`, (response: any) => {
      console.log('Server response:', response);
      userStore.setMessage(response);
    });
    message.value = '';
  }
}

onBeforeMount(() => {
  watch(
    () => [userStore.isAuthInitialized, route.fullPath],
    async (newVal) => {
      if (newVal) {
        // socket.value = io({
        //   path: '/api/socket.io',
        // });

        // socket.value.emit('joinRoom', userStore.userGetter, props.tabActive, (response: any) => {
        //   console.log(response);
        // });

        // socket.value.on('joinMessage', (data: any) => {
        //   console.log('Received message:', data);
        // });

        // socket.value.on('message', (message: string) => {
        //   console.log('New message received:', message);
        // });
      }
    },
    {
      immediate: true,
    }
  )
});
</script>

<style lang="scss" scoped>
.chat__input {
  position: relative;
  width: 100%;
  height: 10%;
  @include flex-col-start();
  justify-content: center;
  border-top: 1px solid #2d9cdb;

  padding: size(23px) size(52px) size(29px) size(12px);

  .input {
    color: #000;
    font-size: size(15px);
    font-family: 'Barlow', sans-serif;
    font-weight: 400;
    line-height: size(18px);
    word-wrap: break-word;
    border: none;
  }
}
</style>

<template>
  <div class="w-full relative">
    <div class="relative w-full flex-col-start bg-[#DFF0FA] rounded-[14px] pt-[9px] pb-[6px] px-[15px] z-10">
      <h4 class="text-[#464154] text-[15px] font-normal font-['Barlow'] leading-[18px]">{{ message.content ?
        message.content : 'Null' }}</h4>
      <p class="text-[#a8a8a8] text-[10px] font-normal font-['Barlow'] leading-[18px]">{{ new Date(message.createdAt) }}
      </p>
    </div>
    <img alt="play"
      :class="{ 'left-[10px]': message.senderId === userStore.userGetter.id, 'right-[10px]': message.senderId !== userStore.userGetter.id }"
      class="min-h-max min-w-max max-w-[16px] max-h-[21px] absolute  -bottom-[20px] transform -translate-y-1/2 w-[24px] h-[24px] z-[0]"
      src="/icons/play.svg">
  </div>
</template>

<script lang="ts" setup>
import { useUserStore } from '~/store/user.store';

defineProps({
  message: {
    type: Object,
    required: true,
  }
});
const userStore = useUserStore();
</script>

<style lang="scss" scoped></style>

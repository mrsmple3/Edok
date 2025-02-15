<template>
  <div
      class="w-full h-full flex-col-start justify-between bg-white rounded-[14px] border border-[#2d9cdb] overflow-hidden">
    <div class="w-full h-[90%] flex-col-start gap-5 py-[18px] px-5">
      <ChatValue/>
      <ChatValue/>
    </div>
    <div class="chat__input">
      <Input class="input focus-visible:!ring-0" placeholder="Введiть повiдомлення"/>
      <img alt="send" class="absolute top-1/2 -translate-y-1/2 right-[23px] w-[24px] h-[22px]"
           src="/icons/telegram.svg">
    </div>
  </div>
</template>

<script lang="ts" setup>

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
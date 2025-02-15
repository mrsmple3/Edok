<template>
  <div class="page-container">
    <h2 class="page__title mb-[25px]">Архів</h2>
    <div class="flex-center gap-[5px] mb-[26px]">
      <NuxtLink class="breadcrumbs" to="">Архів</NuxtLink>
    </div>
    <div class="page__block">
      <div class="not-found">
        <img alt="not-found" class="min-h-max min-w-max w-[130px] h-[164px] mb-[44px]"
             src="/icons/file-wrong_svgrepo.com.svg">
        <h3 class="text-[#464154] text-[25px] font-semibold font-['Barlow'] mb-[31px]">Тут нічого немає</h3>
        <p class="w-[950px] text-center text-[#464154] text-[20px] font-light font-['Barlow']">Система автоматично
          Тут нічого немає
          Система автоматично додає в розділ Архів документи, що вимагають дій з Вашого боку: підписання, узгодження або
          прийняття</p>
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
definePageMeta({
  layout: 'page',
});
</script>


<style lang="scss" scoped>

</style>
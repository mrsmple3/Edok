<template>
  <div class="page-container">
    <div class="w-full flex-center justify-between mb-[18px]">
      <div class="flex-center">
        <h2 class="page__title mr-[32px]">Контакты</h2>

        <button
            class="submenu-parent relative flex-center gap-[11px] rounded-[14px] border border-[#2d9cdb] py-2 px-7 text-[#2d9cdb] text-[18px] font-bold font-['Barlow'] mr-[24px] hover:active"
            @click="router.push('/add-contact')">
          <img alt="plus" class="w-[19px] h-[19px] min-h-max min-w-max" src="/icons/plus-blue.svg">
          Новый
          <div class="submenu">
            <span>Добавить спецификацию</span>
            <span>Добавить счет</span>
            <span>Добавить накладную</span>
            <span>Добавить подтверждающие документы</span>
          </div>
        </button>
        <button
            class="submenu-parent relative flex-center gap-[11px] rounded-[14px] border border-[#2d9cdb] py-2 px-7 text-[#2d9cdb] text-[18px] font-bold font-['Barlow'] mr-[24px] hover:active">
          <img alt="plus" class="w-[19px] h-[19px] min-h-max min-w-max" src="/icons/pencil.svg">
          Редактировать
          <div class="submenu">
            <span>Добавить спецификацию</span>
            <span>Добавить счет</span>
            <span>Добавить накладную</span>
            <span>Добавить подтверждающие документы</span>
          </div>
        </button>
        <button
            class="submenu-parent relative flex-center gap-[11px] rounded-[14px] border border-[#2d9cdb] py-2 px-7 text-[#2d9cdb] text-[18px] font-bold font-['Barlow'] mr-[24px] hover:active">
          <img alt="plus" class="w-[19px] h-[19px] min-h-max min-w-max" src="/icons/plus-blue.svg">
          Створити нову угоду
          <div class="submenu">
            <span>Добавить спецификацию</span>
            <span>Добавить счет</span>
            <span>Добавить накладную</span>
            <span>Добавить подтверждающие документы</span>
          </div>
        </button>
      </div>

      <div class="flex-center gap-[15px]">
        <Badge class="w-12 h-12  bg-[#2d9cdb]/20 rounded-[15px]  hover:bg-[#2d9cdb]/30">
          <img alt="filter" src="/icons/filter.svg">
        </Badge>
        <Badge class="w-12 h-12  bg-[#2d9cdb]/20 rounded-[15px]  hover:bg-[#2d9cdb]/30">
          <img alt="filter" src="/icons/restar.svg">
        </Badge>
      </div>
    </div>
    <div class="flex-center gap-[5px] mb-[26px]">
      <NuxtLink class="breadcrumbs" to="">Контакты</NuxtLink>
    </div>
    <div class="page__block  pt-[40px] pb-[40px] px-[42px]">
      <ContactTable :tableData="contactData"/>
    </div>
  </div>
</template>

<script lang="ts" setup>
definePageMeta({
  layout: 'page',
});
const router = useRouter();
const contactData = [
  {
    name: 'ТОВ "АТ Каргілл"',
    code: '20010397',
    status: 'Є спільні угоди',
    email: 'mail@mail.ru',
    phone: '+38 (067) 348 74 24',
    date: '06.12.2024',
    isActive: false,
  },
  {
    name: 'ТОВ "АТ Каргілл"',
    code: '20010397',
    status: 'Є спільні угоди',
    email: 'mail@mail.ru',
    phone: '+38 (067) 348 74 24',
    date: '06.12.2024',
    isActive: false,
  },
  {
    name: 'ТОВ "АТ Каргілл"',
    code: '20010397',
    status: 'Є спільні угоди',
    email: 'mail@mail.ru',
    phone: '+38 (067) 348 74 24',
    date: '06.12.2024',
    isActive: false,
  },
]
</script>

<style lang="scss" scoped>

</style>
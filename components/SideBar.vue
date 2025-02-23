<template>
  <div class="sidebar__width w-full h-[100vh] flex-col-start bg-white pt-[30px] pr-[40px]">
    <div class="flex-col-start px-[50px]">
      <LoGo class=" mb-[5px]"/>
      <p class=" text-[#b9babd] text-xs font-normal mb-[56px]">Сервис электронного <br> документаоборота</p>
    </div>
    <div class="flex-center gap-[13px] mb-[34px] pl-[50px]">
      <img alt="profile-pictures" class="w-14 h-14 rounded-[63px] border-4 border-[#00b074]"
           src="/images/placeholder-profile-img.png">
      <div class="text-[#464154] text-base font-normal font-['Barlow']">Здравствуйте, <strong>Николай</strong></div>
    </div>
    <div class="flex-stretch self-center justify-self-center gap-[20px] mb-[32px]">
      <button class="relative w-12 h-12 bg-[#2d9cdb]/20 flex items-center justify-center rounded-[15px]">
        <img alt="sms" class="w-7 h-7" src="/icons/sms-blue.svg">
        <div class="chip">
          53
        </div>
      </button>
      <button class="relative w-12 h-12 bg-[#ff5b5b]/20 flex items-center justify-center rounded-[15px]">
        <img alt="sms" class="w-7 h-7" src="/icons/setting-red-light.svg">
      </button>
    </div>
    <div class="w-full flex-col-start gap-2">
      <NuxtLink
          v-for="link in sidebarLinks"
          :to="link.route"
          class="sidebar__link pl-[50px]"
          exact-active-class="active" @click="chatState = false">
        <div
            class="sidebar__link__item relative min-w-[250px] flex-center !justify-start  gap-[20px] text-black text-lg font-medium font-['Barlow'] py-3 px-[50px] rounded-lg">
          <img :src="link.icon" alt="sms" class="w-[30px] h-[30px]">
          <span>{{ link.title }}</span>
        </div>
      </NuxtLink>
    </div>
  </div>
</template>

<script lang="ts" setup>
const chatState = useState('isChat');
const sidebarLinks = ref([
  {
    title: 'Мої задачі',
    icon: '/icons/doc.svg',
    route: '/'
  },
  {
    title: 'Угоди',
    icon: '/icons/doc-and-pencil.svg',
    route: '/leads'
  },
  {
    title: 'Документи',
    icon: '/icons/Opened%20Folder.svg',
    route: '/docs'
  },
  {
    title: 'Архів угод',
    icon: '/icons/Product%20Documents.svg',
    route: '/archive'
  },
  {
    title: 'Контакти',
    icon: '/icons/Document%20Writer.svg',
    route: '/contacts'
  }
])
</script>

<style lang="scss" scoped>
//.sidebar__width {
//  width: size(350px);
//}

.chip {
  position: absolute;
  top: -20%;
  right: -20%;
  padding: 2px 5px;
  display: flex;
  align-self: center;
  justify-content: center;
  text-align: center;
  background: #2D9CDB;
  border-radius: 9999px;
  border: 3px #F3F2F7 solid;
  color: white;
  font-size: size(12px);
  font-family: 'Barlow', sans-serif;
  font-weight: 400;
  line-height: 18px;
  word-wrap: break-word
}

.sidebar__link {
  position: relative;

  &.active {
    &::before {
      content: '';
      position: absolute;
      left: 0;
      top: 0;
      width: 4px;
      height: 100%;
      background: #00B074;
      border-radius: 0 10px 10px 0;
    }

    span {
      color: #00B074;
      font-weight: 600;
    }

    img {
      filter: invert(0.35) sepia(1) saturate(5) hue-rotate(120deg) brightness(0.9) contrast(0.85);
    }

    .sidebar__link__item {
      background: rgba(0, 176, 116, 0.15);
    }
  }
}
</style>
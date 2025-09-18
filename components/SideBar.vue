<template>
  <div class="sidebar__width w-full h-[100vh] flex-col-start bg-white pt-[30px] pr-[40px]">
    <div class="flex-col-start px-[50px]">
      <LoGo class=" mb-[5px]" />
      <p class=" text-[#b9babd] text-xs font-normal mb-[56px]">Сервіс електронного <br> документообігу</p>
    </div>
    <div class="flex-center gap-[13px] mb-[34px] pl-[50px]">
      <img alt="profile-pictures" class="w-14 h-14 rounded-[63px] border-4 border-[#00b074]"
        src="/images/placeholder-profile-img.png">
      <div class="text-[#464154] text-base font-normal font-['Barlow']">Вітаємо,
        <strong>
          {{ userStore.userGetter.name || userStore.userGetter.phone || userStore.userGetter.email }}
        </strong>
      </div>
    </div>
    <div class="flex-stretch self-center justify-self-center gap-[20px] mb-[32px]">
      <button class="relative w-12 h-12 bg-[#2d9cdb]/20 flex items-center justify-center rounded-[15px]"
        @click="openChat" v-if="userStore.userRole === 'counterparty'">
        <img alt="sms" class="w-7 h-7" src="/icons/sms-blue.svg">
      </button>
      <ProfileWindow />
    </div>
    <div class="w-full flex-col-start gap-2 flex-grow">
      <NuxtLink v-for="link in sidebarLinks" :to="link.route" class="sidebar__link pl-[50px]"
        exact-active-class="active" @click="chatState = false">
        <div
          class="sidebar__link__item relative min-w-[250px] flex-center !justify-start  gap-[20px] text-black text-lg font-medium font-['Barlow'] py-3 px-[30px] rounded-lg">
          <img :src="link.icon" alt="sms" class="w-[30px] h-[30px]">
          <span>{{ link.title }}</span>
        </div>
      </NuxtLink>
    </div>

    <!-- Кнопка выхода из аккаунта -->
    <div class="mt-auto mb-6 pl-[50px]">
      <button @click="handleLogout"
        class="sidebar__logout__btn relative min-w-[250px] flex-center !justify-center gap-[20px] text-red-600 text-lg font-medium font-['Barlow'] py-3 rounded-lg hover:bg-red-50 transition-colors duration-200">
        <svg class="w-[30px] h-[30px]" fill="currentColor" viewBox="0 0 24 24">
          <path
            d="M17 7l-1.41 1.41L18.17 11H8v2h10.17l-2.58 2.59L17 17l5-5zM4 5h8V3H4c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h8v-2H4V5z" />
        </svg>
        <span>Вийти з аккаунту</span>
      </button>
    </div>
  </div>
</template>

<script lang="ts" setup>
import type { User } from "@prisma/client";
import { io, Socket } from "socket.io-client";
import { useUserStore } from '~/store/user.store';

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
]);

const userStore = useUserStore();
const router = useRouter();
const route = useRoute();
const socket = ref<Socket>();

// Функция выхода из аккаунта
const handleLogout = async () => {
  try {
    // Закрываем socket соединение если есть
    if (userStore.$state.socket) {
      userStore.$state.socket.disconnect();
      userStore.$state.socket = null;
    }

    // Очищаем чат состояние
    chatState.value = false;

    // Вызываем logout из store
    await userStore.logout();

    // Перенаправляем на страницу входа
    await router.push('/login');

  } catch (error) {
    console.error('Ошибка при выходе из аккаунта:', error);
    // В случае ошибки все равно перенаправляем на логин
    await router.push('/login');
  }
};

const openChat = () => {
  if (userStore.userRole === 'counterparty') {
    if (!userStore.$state.socket) {
      // Создаем соединение, если оно еще не создано
      userStore.$state.socket = io({
        path: '/socket.io',
      });

      // Обработка событий
      userStore.$state.socket.on('joinMessage', (data: { message: string; user: User; room: string }) => {
        console.log('Join message received:', data.message);
      });
      userStore.$state.socket.on('message', (message: any) => {
        console.log('New message received:', message);
        if (message.senderId === userStore.userGetter.id) {
          console.log('Сообщение отправлено текущим пользователем, пропускаем');
          return;
        }
        userStore.setMessage(message);
      });
    }

    const room = `${route.query.room}${route.query.id}`;

    if (chatState.value) {
      // Выход из комнаты
      userStore.$state.socket.emit('leaveRoom', room, (response: any) => {
        console.log('Left room:', response);
      });
      router.push({ path: route.path });
    } else {
      // Вход в комнату
      router.push({ path: route.path, query: { room: 'all', id: userStore.userGetter.id } });
      userStore.$state.socket.emit('joinRoom', userStore.userGetter, 'all' + userStore.userGetter.id, (response: any) => {
        console.log('Joined room:', response);
        userStore.setMessages(response);
      });
    }

    chatState.value = !chatState.value;
  }
};

onBeforeMount(async () => {
  watch(
    () => [userStore.isAuthInitialized, route.fullPath],
    async ([newVal, changedRoute]) => {
      if (newVal && userStore.$state.user.role !== 'counterparty') {
        callOnce(() => {
          if (sidebarLinks.value.find(link => link.title === 'Контакти')) {
            return;
          }
          sidebarLinks.value.push({
            title: 'Контакти',
            icon: '/icons/Document%20Writer.svg',
            route: '/contacts'
          })
        });
      }
    },
    {
      immediate: true,
    }
  )
})
</script>

<style lang="scss" scoped>
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

// Стили для кнопки выхода
.sidebar__logout__btn {
  &:hover {
    background-color: rgba(239, 68, 68, 0.1);

    span {
      color: #dc2626;
    }

    svg {
      color: #dc2626;
    }
  }

  transition: all 0.2s ease-in-out;
}
</style>

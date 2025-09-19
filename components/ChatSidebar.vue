<template>
  <div class="chat">
    <button class="chat-hide-btn text-[#a8a8a8] text-xs font-normal font-['Barlow']">Скрыть повідомлення</button>
    <h3 class="chat-title text-[#464154] font-semibold font-['Barlow']">Повідомлення</h3>
    <Tabs :model-value="tabActive" @update:model-value="updateTab" class="w-full h-full" default-value="all">
      <TabsList class="w-full flex justify-start p-0 bg-transparent chat-tabs-list">
        <TabsTrigger
          class="chat-tab border-b-2 border-[#2d9cdb]/20 data-[state=active]:!bg-transparent data-[state=active]:!border-b-[#2d9cdb] !text-[#464154] data-[state=active]:!text-[#2d9cdb] !font-normal"
          value="all">
          Всі
        </TabsTrigger>
        <TabsTrigger
          class="chat-tab border-b-2 border-[#2d9cdb]/20 data-[state=active]:!border-b-[#2d9cdb] !text-[#464154] data-[state=active]:!text-[#2d9cdb] !font-normal"
          value="leads">
          Обговорення
        </TabsTrigger>
        <TabsTrigger
          class="chat-tab border-b-2 border-[#2d9cdb]/20 data-[state=active]:!border-b-[#2d9cdb] !text-[#464154] data-[state=active]:!text-[#2d9cdb] !font-normal"
          value="docs">
          Докумен
        </TabsTrigger>
        <TabsTrigger
          class="chat-tab border-b-2 border-[#2d9cdb]/20 data-[state=active]:!border-b-[#2d9cdb] !text-[#464154] data-[state=active]:!text-[#2d9cdb] !font-normal"
          value="system">
          Cистема
        </TabsTrigger>
      </TabsList>
      <TabsContent class="chat-content" value="all">
        <ChatBlock :tabActive="tabActive" />
      </TabsContent>
      <TabsContent class="chat-content" value="leads">
        <ChatBlock :tabActive="tabActive" />
      </TabsContent>
      <TabsContent class="chat-content" value="docs">
        <ChatBlock :tabActive="tabActive" />
      </TabsContent>
      <TabsContent class="chat-content" value="system">
        <ChatBlock :tabActive="tabActive" />
      </TabsContent>
    </Tabs>
  </div>
</template>

<script lang="ts" setup>
import { io, Socket } from "socket.io-client";
import { useAdminStore } from "~/store/admin.store";
import { useUserStore } from "~/store/user.store";

const tabActive = ref('all');
const userStore = useUserStore();
const adminStore = useAdminStore();
const router = useRouter();
const route = useRoute();

// Обновляем значение tabActive при переключении вкладки
const updateTab = (newValue: string | number) => {
  tabActive.value = String(newValue);

  userStore.$state.socket.emit('leaveRoom', `${route.query.room}${route.query.id}`, (response: any) => {
    console.log('Left room:', response);
  });

  router.push({ path: route.path, query: { room: tabActive.value, id: route.query.id } });

  const currentUser = userStore.userRole === 'counterparty' ? userStore.userGetter : adminStore.getterUserById(Number(route.query.id));

  userStore.$state.socket.emit('joinRoom', currentUser, `${tabActive.value}${route.query.id}`, (response: any) => {
    console.log(response);
    userStore.setMessages(response);
  });
  userStore.$state.socket.on('joinMessage', (data: any) => {
    console.log('Received message:', data);
  });
  userStore.$state.socket.on('message', (message: any) => {
    console.log('New message received:', message);
    if (message.senderId === userStore.userGetter.id) {
      console.log('Сообщение отправлено текущим пользователем, пропускаем');
      return;
    }
    userStore.setMessage(message);
  });
};
</script>

<style lang="scss" scoped>
.chat {
  width: 100%;
  height: 100%;
  @include flex-col-start();
  padding: size(30px) size(35px);
  background: white;
}

// Кнопка скрытия чата
.chat-hide-btn {
  margin-bottom: size(16px); // mb-4 = 16px
}

// Заголовок чата
.chat-title {
  font-size: size(32px);
  margin-bottom: size(30px);
}

// Список табов
.chat-tabs-list {
  margin-bottom: size(34px);
}

// Отдельные табы
.chat-tab {
  font-size: size(15px) !important;
  padding-bottom: size(6px) !important;
  padding-left: size(10px) !important;
  padding-right: size(10px) !important;
}

// Контент табов
.chat-content {
  height: size(760px);
}
</style>

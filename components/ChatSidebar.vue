<template>
  <div class="chat">
    <button class="text-[#a8a8a8] text-xs font-normal font-['Barlow'] mb-4">Скрыть повідомлення</button>
    <h3 class="text-[#464154] text-[32px] font-semibold font-['Barlow'] mb-[30px]">Повідомлення</h3>
    <Tabs :model-value="tabActive" @update:model-value="updateTab" class="w-full h-full" default-value="all">
      <TabsList class=" w-full flex justify-start p-0 bg-transparent mb-[34px]">
        <TabsTrigger
          class="border-b-2  border-[#2d9cdb]/20 data-[state=active]:!bg-transparent data-[state=active]:!border-b-[#2d9cdb] !text-[#464154] data-[state=active]:!text-[#2d9cdb] !text-[15px] !font-normal pb-[6px] px-[10px]"
          value="all">
          Всі
        </TabsTrigger>
        <TabsTrigger
          class="border-b-2 border-[#2d9cdb]/20 data-[state=active]:!border-b-[#2d9cdb] !text-[#464154] data-[state=active]:!text-[#2d9cdb] !text-[15px] !font-normal pb-[6px] px-[10px]"
          value="leads">
          Обговорення
        </TabsTrigger>
        <TabsTrigger
          class="border-b-2 border-[#2d9cdb]/20 data-[state=active]:!border-b-[#2d9cdb] !text-[#464154] data-[state=active]:!text-[#2d9cdb] !text-[15px] !font-normal pb-[6px] px-[10px]"
          value="docs">
          Докумен
        </TabsTrigger>
        <TabsTrigger
          class="border-b-2 border-[#2d9cdb]/20 data-[state=active]:!border-b-[#2d9cdb] !text-[#464154] data-[state=active]:!text-[#2d9cdb] !text-[15px] !font-normal pb-[6px] px-[10px]"
          value="system">
          Cистема
        </TabsTrigger>
      </TabsList>
      <TabsContent class="h-[760px]" value="all">
        <ChatBlock :tabActive="tabActive" />
      </TabsContent>
      <TabsContent class="h-[760px]" value="leads">
        <ChatBlock :tabActive="tabActive" />
      </TabsContent>
      <TabsContent class="h-[760px]" value="docs">
        <ChatBlock :tabActive="tabActive" />
      </TabsContent>
      <TabsContent class="h-[760px]" value="system">
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
</style>

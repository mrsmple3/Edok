<template>
  <div class="chat">
    <button class="text-[#a8a8a8] text-xs font-normal font-['Barlow'] mb-4">Скрыть повідомлення</button>
    <h3 class="text-[#464154] text-[32px] font-semibold font-['Barlow'] mb-[30px]">Повідомлення</h3>
    <Tabs class="w-full h-full" default-value="all">
      <TabsList class=" w-full flex items-center p-0 bg-transparent mb-[34px]">
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
      <TabsContent class="h-[92%]" value="all">
        <ChatBlock/>
      </TabsContent>
    </Tabs>
  </div>
</template>

<script lang="ts" setup>

</script>

<style lang="scss" scoped>
.chat {
  width: 100%;
  height: 100%;
  @include flex-col-start();
  padding: size(33px) size(35px);
  background: white;
}
</style>
<template>
  <div class="page-container">
    <div class="w-full flex-center justify-between mb-[18px]">
      <div class="flex-center">
        <h2 class="page__title mr-[32px]">Контакти</h2>
      </div>
    </div>
    <div class="flex-center gap-[5px] mb-[26px]">
      <NuxtLink class="breadcrumbs" to="/contacts">Контакти</NuxtLink>
    </div>
    <div class="page__block flex-center justify-center py-[50px] px-[42px]">
      <Tabs class="form__container" default-value="account">
        <TabsList class="w-full flex items-center bg-transparent justify-center gap-8 mb-[122px]">
          <TabsTrigger
            class="!w-max data-[state=active]:!bg-[#00b074]/20 rounded-lg !text-center !text-[#464154] data-[state=active]:!text-[#00b074] !text-lg !font-bold py-[15px] px-[30px]"
            value="account">
            Введіть дані контакту
          </TabsTrigger>
        </TabsList>
        <TabsContent value="account">
          <ContactsAddCounterparty v-if="route.query.role === 'counterparty'" />
          <ContactsAddModerator v-else />
        </TabsContent>
      </Tabs>
    </div>
  </div>
</template>

<script lang="ts" setup>
definePageMeta({
  layout: 'page',
});
const route = useRoute();
</script>

<style lang="scss" scoped>
.form__container {
  width: size(490px);
}

.form__input {
  width: 100%;
  color: #969ba0;
  height: max-content;
  font-size: 1rem;
  font-weight: normal;
  background: #FDFDFD;
  padding: size(18px) size(28px);
  border-radius: 10px;
}

.form__submit-btn {
  width: size(179px);
  height: size(54px);
  background: #00B074;
  border-radius: 8px;
  text-align: center;
  color: white;
  font-size: 18px;
  font-family: "Barlow", sans-serif;
  font-weight: 700;
  word-wrap: break-word;
  margin: 0 auto;

  &.outline {
    background: transparent;
    color: #00B074;
  }
}
</style>

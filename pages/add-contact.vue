<template>
  <div class="page-container">
    <div class="w-full flex-center justify-between mb-[18px]">
      <div class="flex-center">
        <h2 class="page__title mr-[32px]">Контакты</h2>

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
      <NuxtLink class="breadcrumbs" to="">ТОВ "АТ Каргілл"</NuxtLink>
    </div>
    <div class="page__block flex-center justify-center py-[50px] px-[42px]">
      <Tabs class="form__container" default-value="account">
        <TabsList class="w-full flex items-center bg-transparent justify-center gap-8 mb-[122px]">
          <TabsTrigger
              class="!w-max data-[state=active]:!bg-[#00b074]/20 rounded-lg !text-center !text-[#464154] data-[state=active]:!text-[#00b074] !text-lg !font-bold py-[15px] px-[30px]"
              value="account">
            Данные контакта
          </TabsTrigger>
          <TabsTrigger
              class="!w-max data-[state=active]:!bg-[#00b074]/20 rounded-lg !text-center !text-[#464154] data-[state=active]:!text-[#00b074] !text-lg !font-bold py-[15px] px-[30px]"
              value="password">
            Соглашения
          </TabsTrigger>
        </TabsList>
        <TabsContent value="account">
          <form class="flex flex-col items-center" @submit="onSubmit">
            <div class="w-full flex flex-col items-stretch gap-[13px] mb-[57px]">
              <FormField v-slot="{ componentField }" name="company">
                <FormItem>
                  <FormControl>
                    <Input class="form__input"
                           placeholder="Название компании"
                           type="text"
                           v-bind="componentField"/>
                  </FormControl>
                  <FormMessage/>
                </FormItem>
              </FormField>
              <FormField v-slot="{ componentField }" name="code">
                <FormItem>
                  <FormControl>
                    <Input class="form__input"
                           placeholder="ЄДРПОУ/РНОКПП"
                           type="text"
                           v-bind="componentField"/>
                  </FormControl>
                  <FormMessage/>
                </FormItem>
              </FormField>
              <FormField v-slot="{ componentField }" name="username">
                <FormItem>
                  <FormControl>
                    <Input class="form__input"
                           placeholder="Електронна адреса"
                           type="text"
                           v-bind="componentField"/>
                  </FormControl>
                  <FormMessage/>
                </FormItem>
              </FormField>
              <FormField v-slot="{ componentField }" name="phone">
                <FormItem>
                  <FormControl>
                    <Input v-mask="'+###(##) ###-##-##'" class="form__input" placeholder="Телефон" type="tel"
                           v-bind="componentField"/>
                  </FormControl>
                  <FormMessage/>
                </FormItem>
              </FormField>
            </div>
            <div class="flex-center gap-[30px]">
              <Button class="form__submit-btn outline" @click="router.push({path: '/contacts'})">
                Отменить
              </Button>
              <Button class="form__submit-btn" type="submit">
                Сохранить
              </Button>
            </div>
          </form>
        </TabsContent>
        <TabsContent value="password">
          <Card>
            <CardHeader>
              <CardTitle>Password</CardTitle>
              <CardDescription>
                Change your password here. After saving, you'll be logged out.
              </CardDescription>
            </CardHeader>
            <CardContent class="space-y-2">
              <div class="space-y-1">
                <Label for="current">Current password</Label>
                <Input id="current" type="password"/>
              </div>
              <div class="space-y-1">
                <Label for="new">New password</Label>
                <Input id="new" type="password"/>
              </div>
            </CardContent>
            <CardFooter>
              <Button>Save password</Button>
            </CardFooter>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  </div>
</template>

<script lang="ts" setup>
definePageMeta({
  layout: 'page',
});
import {useForm} from 'vee-validate'
import {toTypedSchema} from '@vee-validate/zod'
import * as z from 'zod'

const formSchema = toTypedSchema(z.object({
  company: z.string().min(2).max(50),
  code: z.string().min(6).max(50),
  username: z.string().min(2).max(50),
  phone: z.string().min(9).max(50),
}))

const form = useForm({
  validationSchema: formSchema,
})

const onSubmit = form.handleSubmit((values) => {
  console.log('Form submitted!', values);
});
const router = useRouter();
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
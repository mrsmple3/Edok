<template>
  <div class="w-full h-[100vh] flex items-center justify-center">
    <div class="form__container flex-col-center">
      <LoGo class="mb-[7px]"/>
      <p class="text-center text-[#b9babd] text-xs font-normal mb-[57px]">Сервис электронного документаоборота</p>
      <Tabs class="w-full" default-value="account">
        <TabsList class=" w-full flex items-center justify-between mb-[38px]">
          <TabsTrigger
              class="!w-max data-[state=active]:!bg-[#00b074]/20 rounded-lg !text-center !text-[#464154] data-[state=active]:!text-[#00b074] !text-lg !font-bold py-[15px] px-[30px]"
              value="account">
            Вход по реквизитам
          </TabsTrigger>
          <TabsTrigger
              class="!w-max data-[state=active]:!bg-[#00b074]/20 rounded-lg !text-center !text-[#464154] data-[state=active]:!text-[#00b074] !text-lg !font-bold py-[15px] px-[30px]"
              value="password">
            Вход по КЕП
          </TabsTrigger>
        </TabsList>
        <TabsContent value="account">
          <form class="flex flex-col items-center" @submit="onSubmit">
            <div class="w-full flex flex-col items-stretch gap-[13px] mb-[40px]">
              <FormField v-slot="{ componentField }" name="username">
                <FormItem>
                  <FormControl>
                    <Input class="form__input"
                           placeholder="Адреса електронної пошти"
                           type="text"
                           v-bind="componentField"/>
                  </FormControl>
                  <FormMessage/>
                </FormItem>
              </FormField>
              <FormField v-slot="{ componentField }" name="password">
                <FormItem>
                  <FormControl>
                    <Input class="form__input" placeholder="Пароль" type="text" v-bind="componentField"/>
                  </FormControl>
                  <FormMessage/>
                </FormItem>
              </FormField>
            </div>
            <Button class="form__submit-btn" type="submit">
              Submit
            </Button>
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
import {useForm} from 'vee-validate'
import {toTypedSchema} from '@vee-validate/zod'
import * as z from 'zod'
import {useUserStore} from "~/store/user.store";

const formSchema = toTypedSchema(z.object({
  username: z.string().min(2).max(50),
  password: z.string().min(6).max(50),
}))

const form = useForm({
  validationSchema: formSchema,
})

const router = useRouter();

const authStore = useUserStore();

const onSubmit = form.handleSubmit( async(values) => {
  let response = ref();
  if (values.username.includes('@')) {
    response.value = await authStore.login({
      email: values.username,
      password_hash: values.password
    });
  } else {
    response.value = await authStore.login({
      phone: values.username,
      password_hash: values.password
    });
  }
  //TODO: ADD TOAST there to errors and success
  if (!response.value.body.error) {
    await authStore.initAuth().then(()=> {
      router.push('/');
    });
  } else {
    console.log(response.value.message);
  }
})

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
  padding: 18px 28px;
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
}
</style>
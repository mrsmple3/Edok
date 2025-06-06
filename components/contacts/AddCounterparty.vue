<template>
  <form class="flex flex-col items-center" @submit="onSubmit">
    <div class="w-full flex flex-col items-stretch gap-[13px] mb-[57px]">
      <FormField v-slot="{ componentField }" name="company">
        <FormItem>
          <FormControl>
            <Input class="form__input" placeholder="Назва компанії" type="text" v-bind="componentField" />
          </FormControl>
          <FormMessage />
        </FormItem>
      </FormField>
      <FormField v-slot="{ componentField }" name="code">
        <FormItem>
          <FormControl>
            <Input class="form__input" placeholder="ЄДРПОУ/РНОКПП" type="text" v-bind="componentField" />
          </FormControl>
          <FormMessage />
        </FormItem>
      </FormField>
      <FormField v-slot="{ componentField }" name="email">
        <FormItem>
          <FormControl>
            <Input class="form__input" placeholder="Електронна адреса" type="text" v-bind="componentField" />
          </FormControl>
          <FormMessage />
        </FormItem>
      </FormField>
      <FormField v-slot="{ componentField }" name="phone">
        <FormItem>
          <FormControl>
            <Input v-mask="'+###(##) ###-##-##'" class="form__input" placeholder="Телефон" type="tel"
              v-bind="componentField" />
          </FormControl>
          <FormMessage />
        </FormItem>
      </FormField>
    </div>
    <div class="flex-center gap-[30px]">
      <Button class="form__submit-btn outline" @click="router.push({ path: '/contacts' })">
        Скасувати
      </Button>
      <Button class="form__submit-btn" type="submit">
        Створити
      </Button>
    </div>
  </form>
</template>

<script setup lang="ts">
import { useForm } from 'vee-validate'
import { toTypedSchema } from '@vee-validate/zod'
import * as z from 'zod'
import { useAdminStore } from '~/store/admin.store';
import { useToast } from '../ui/toast';

const router = useRouter();
const adminStore = useAdminStore();

const formSchema = toTypedSchema(z.object({
  company: z.string().min(2).max(50),
  code: z.string().min(6).max(50),
  email: z.string().min(2).max(50),
  phone: z.string().min(9).max(50),
}))

const form = useForm({
  validationSchema: formSchema,
})

const onSubmit = form.handleSubmit(async (values) => {
  try {
    const { company, code, email, phone } = values;
    const newCounterparty = {
      organization_INN: code,
      organization_name: company,
      email: email,
      phone: phone,
      password_hash: "123456",
      role: "counterparty",
    };

    await adminStore.createUser(newCounterparty)
      .then(() => {
        router.push({ path: '/contacts' });
      })
      .catch((error) => {
        console.error('Error creating counterparty:', error);
      });
  } catch (error: any) {
    const { toast } = useToast();
    toast({
      title: "Ошибка",
      description: error.message,
      variant: "destructive",
    });
    console.log(error.message);
  }
});
</script>

<style scoped lang="scss">
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

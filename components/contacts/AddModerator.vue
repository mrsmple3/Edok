<template>
  <form class="flex flex-col items-center" @submit="onSubmit">
    <div class="form-fields-container">
      <FormField v-slot="{ componentField }" name="name">
        <FormItem>
          <FormControl>
            <Input class="form__input" placeholder="Имя" type="text" v-bind="componentField" />
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
    <div class="form-buttons-container">
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
  name: z.string().min(2).max(50),
  email: z.string().min(2).max(50),
  phone: z.string().min(9).max(50),
}));

const form = useForm({
  validationSchema: formSchema,
});

const { toast } = useToast();
const route = useRoute();

const onSubmit = form.handleSubmit(async (values) => {
  try {
    const { name, email, phone } = values;
    const newCounterparty = {
      name: name,
      email: email,
      phone: phone,
      password_hash: "123456",
      role: route.query.role,
    };

    await adminStore.createUser(newCounterparty)
      .then(() => {
        router.push({ path: '/contacts' });
      })
      .catch((error) => {
        toast({
          title: "Ошибка",
          description: error.message,
          variant: "destructive",
        });
        console.error('Error creating counterparty:', error);
      });
  } catch (error: any) {
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
.form-fields-container {
  width: 100%;
  display: flex;
  flex-direction: column;
  align-items: stretch;
  gap: size(13px);
  margin-bottom: size(57px);
}

.form-buttons-container {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: size(30px);
}

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

<template>
  <Dialog v-model:open="isDialogOpen">
    <DialogTrigger>
      <button class="relative profile-trigger-btn bg-[#ff5b5b]/20 flex items-center justify-center">
        <img alt="user-setting" class="profile-trigger-icon" src="/icons/setting-red-light.svg">
      </button>
    </DialogTrigger>
    <DialogContent>
      <DialogHeader>
        <DialogTitle>Профіль</DialogTitle>
        <DialogDescription> Можете змінити дані {{ userStore.userGetter.name || userStore.userGetter.phone ||
          userStore.userGetter.email }} </DialogDescription>
      </DialogHeader>
      <div class="grid gap-4 py-4">
        <FormField name="name" v-slot="{ componentField }">
          <FormItem class="grid grid-cols-4 items-center gap-4">
            <FormControl>
              <Label for="name" class="profile-label text-start"> Ім'я </Label>
              <div class="col-span-3 flex flex-col gap-2">
                <Input id="name" type="text" v-bind="componentField" />
                <FormMessage />
              </div>
            </FormControl>
          </FormItem>
        </FormField>
        <FormField name="email" v-slot="{ componentField }">
          <FormItem class="grid grid-cols-4 items-center gap-4">
            <FormControl>
              <Label for="type" class="profile-label text-start"> Пошта </Label>
              <div class="col-span-3 flex flex-col gap-2">
                <Input id="type" type="text" v-bind="componentField" />
                <FormMessage />
              </div>
            </FormControl>
          </FormItem>
        </FormField>
        <FormField name="organization_name" v-slot="{ componentField }">
          <FormItem class="grid grid-cols-4 items-center gap-4">
            <FormControl>
              <Label for="company" class="profile-label text-start"> Компания </Label>
              <div class="col-span-3 flex flex-col gap-2">
                <Input id="company" type="text" v-bind="componentField" />
                <FormMessage />
              </div>
            </FormControl>
          </FormItem>
        </FormField>
        <FormField name="organization_INN" v-slot="{ componentField }">
          <FormItem class="grid grid-cols-4 items-center gap-4">
            <FormControl>
              <Label for="inn" class="profile-label text-start"> ИНН </Label>
              <div class="col-span-3 flex flex-col gap-2">
                <Input id="inn" type="text" v-bind="componentField" />
                <FormMessage />
              </div>
            </FormControl>
          </FormItem>
        </FormField>
        <FormField name="phone" v-slot="{ componentField }">
          <FormItem class="grid grid-cols-4 items-center gap-4">
            <FormControl>
              <Label for="phone" class="profile-label text-start"> Номер телефону </Label>
              <div class="col-span-3 flex flex-col gap-2">
                <Input id="phone" type="text" v-bind="componentField" />
                <FormMessage />
              </div>
            </FormControl>
          </FormItem>
        </FormField>
        <FormField name="oldPassword" v-slot="{ componentField }">
          <FormItem class="grid grid-cols-4 items-center gap-4">
            <FormControl>
              <Label for="oldPassword" class="profile-label text-start"> Старий пароль </Label>
              <div class="col-span-3 flex flex-col gap-2">
                <Input id="oldPassword" type="password" v-bind="componentField" />
                <FormMessage />
              </div>
            </FormControl>
          </FormItem>
        </FormField>
        <FormField name="newPassword" v-slot="{ componentField }">
          <FormItem class="grid grid-cols-4 items-center gap-4">
            <FormControl>
              <Label for="newPassword" class="profile-label text-start"> Новий пароль </Label>
              <div class="col-span-3 flex flex-col gap-2">
                <Input id="newPassword" type="password" v-bind="componentField" />
                <FormMessage />
              </div>
            </FormControl>
          </FormItem>
        </FormField>
      </div>
      <DialogFooter> <Button @click="updateUser">Змінити</Button> </DialogFooter>
    </DialogContent>
  </Dialog>
</template>

<script setup lang="ts">
import { useForm } from "vee-validate";
import { toTypedSchema } from "@vee-validate/zod";
import * as z from "zod";
import { useUserStore } from "~/store/user.store";
import { useToast } from "~/components/ui/toast";
import type { Document } from "~/store/user.store";
import { useAdminStore } from "~/store/admin.store";

const adminStore = useAdminStore();
const userStore = useUserStore();

const isDialogOpen = ref(false);

const formSchema = ref(
  toTypedSchema(
    z.object({
      name: z.string().optional(),
      email: z.string().email("Невірний формат email").optional().or(z.literal("")),
      organization_name: z.string().optional(),
      organization_INN: z.string().optional(),
      phone: z.string().optional(),
      oldPassword: z.string().optional(),
      newPassword: z.string().optional(),
    }).refine((data) => {
      // Если oldPassword заполнен, то newPassword обязателен
      if (data.oldPassword && data.oldPassword.length > 0) {
        return data.newPassword && data.newPassword.length >= 6;
      }
      return true;
    }, {
      message: "Новий пароль обов'язковий при зміні пароля та має бути мінімум 6 символів",
      path: ["newPassword"], // Показывать ошибку на поле newPassword
    }).refine((data) => {
      // Если newPassword заполнен, то oldPassword обязателен
      if (data.newPassword && data.newPassword.length > 0) {
        return data.oldPassword && data.oldPassword.length >= 6;
      }
      return true;
    }, {
      message: "Старий пароль обов'язковий при зміні пароля та має бути мінімум 6 символів",
      path: ["oldPassword"], // Показывать ошибку на поле oldPassword
    })
  )
);

const form = useForm({
  validationSchema: formSchema.value,
});

const updateUser = form.handleSubmit(async (values) => {
  try {
    let response = ref();

    // Формируем объект только с заполненными полями
    const updateData: any = {
      id: userStore.userGetter.id,
      role: userStore.userGetter.role,
    };

    // Добавляем только заполненные поля
    if (values.name) updateData.name = values.name;
    if (values.email) updateData.email = values.email;
    if (values.phone) updateData.phone = values.phone;
    if (values.organization_name) updateData.organization_name = values.organization_name;
    if (values.organization_INN) updateData.organization_INN = values.organization_INN;
    if (values.oldPassword) updateData.oldPassword = values.oldPassword;
    if (values.newPassword) updateData.newPassword = values.newPassword;

    const updatedUser = await userStore.updateUser(updateData);
    isDialogOpen.value = false;
  } catch (error: any) {
    const { toast } = useToast();
    console.log(error);

    if (error.message) {
      toast({
        title: "Помилка",
        description: error.message,
        variant: "destructive",
      });
    } else {
      toast({
        title: "Невідома помилка",
        description: "Спробуйте пізніше",
        variant: "destructive",
      });
    }
  }
});

watch(isDialogOpen, async (newVal) => {
  if (newVal) {
    form.setValues({
      name: userStore.$state.user.name || '',
      email: userStore.$state.user.email || '',
      phone: userStore.$state.user.phone || '',
      organization_INN: userStore.$state.user.organization_INN || '',
      organization_name: userStore.$state.user.organization_name || '',
      oldPassword: '',
      newPassword: '',
    });
  }
});
</script>

<style scoped lang="scss">
// Кнопка триггера профиля
.profile-trigger-btn {
  width: size(48px); // w-12 = 48px
  height: size(48px); // h-12 = 48px
  border-radius: size(15px);
}

// Иконка в кнопке триггера
.profile-trigger-icon {
  width: size(28px); // w-7 = 28px
  height: size(28px); // h-7 = 28px
}

// Лейблы полей формы
.profile-label {
  font-size: size(12px);
}
</style>

<template>
  <Dialog v-model:open="isDialogOpen">
    <DialogTrigger class="flex-center gap-[13px] mb-[34px] pl-[50px]">
      <img alt="profile-pictures" class="w-14 h-14 rounded-[63px] border-4 border-[#00b074]"
        src="/images/placeholder-profile-img.png">
      <div class="text-[#464154] text-base font-normal font-['Barlow']">Вітаємо,
        <strong>
          {{ userStore.userGetter.name || userStore.userGetter.phone || userStore.userGetter.email }}
        </strong>
      </div>
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
              <Label for="name" class="text-[12px] text-start"> Ім'я </Label>
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
              <Label for="type" class="text-[12px] text-start"> Пошта </Label>
              <div class="col-span-3 flex flex-col gap-2">
                <Input id="type" type="text" v-bind="componentField" />
                <FormMessage />
              </div>
            </FormControl>
          </FormItem>
        </FormField>
        <FormField name="phone" v-slot="{ componentField }">
          <FormItem class="grid grid-cols-4 items-center gap-4">
            <FormControl>
              <Label for="phone" class="text-[12px] text-start"> Номер телефону </Label>
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
              <Label for="oldPassword" class="text-[12px] text-start"> Старий пароль </Label>
              <div class="col-span-3 flex flex-col gap-2">
                <Input id="oldPassword" type="text" v-bind="componentField" />
                <FormMessage />
              </div>
            </FormControl>
          </FormItem>
        </FormField>
        <FormField name="newPassword" v-slot="{ componentField }">
          <FormItem class="grid grid-cols-4 items-center gap-4">
            <FormControl>
              <Label for="newPassword" class="text-[12px] text-start"> Новий пароль </Label>
              <div class="col-span-3 flex flex-col gap-2">
                <Input id="newPassword" type="text" v-bind="componentField" />
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
      name: z.string().min(2).max(120),
      email: z.string().min(2).max(120),
      phone: z.string().min(1).max(50),
      oldPassword: z.string().min(6).max(50),
      newPassword: z.string().min(6).max(50),
    })
  )
);

const form = useForm({
  validationSchema: formSchema.value,
});

const updateUser = form.handleSubmit(async (values) => {
  try {
    let response = ref();
    const updatedUser = await userStore.updateUser({
      id: userStore.userGetter.id,
      name: values.name,
      email: values.email,
      phone: values.phone,
      oldPassword: values.oldPassword,
      newPassword: values.newPassword,
      role: userStore.userGetter.role,
    });
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
      oldPassword: '',
      newPassword: '',
    });
  }
});
</script>

<style scoped></style>

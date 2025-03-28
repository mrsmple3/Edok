<template>
	<Dialog v-model:open="isDialogOpen">
		<DialogTrigger class="flex-center gap-[11px] rounded-[14px] border border-[#2d9cdb] py-2 px-7 text-[#2d9cdb] text-[18px] font-bold font-['Barlow'] mr-[24px] hover:active">
			<img alt="plus" class="w-[19px] h-[19px]" src="/icons/plus-blue.svg" />
			Добавить Угоду
		</DialogTrigger>
		<DialogContent>
			<DialogHeader>
				<DialogTitle>Добавить Угоду пользователя</DialogTitle>
				<DialogDescription> Заполните поля сделки </DialogDescription>
			</DialogHeader>
			<div class="grid gap-4 py-4">
				<FormField name="name" v-slot="{ componentField }">
					<FormItem class="grid grid-cols-4 items-center gap-4">
						<FormControl>
							<Label for="name" class="text-[12px] text-start"> Название </Label>
							<div class="col-span-3 flex flex-col gap-2">
								<Input id="name" type="text" v-bind="componentField" />
								<FormMessage />
							</div>
						</FormControl>
					</FormItem>
				</FormField>
				<FormField name="type" v-slot="{ componentField }">
					<FormItem class="grid grid-cols-4 items-center gap-4">
						<FormControl>
							<Label for="type" class="text-[12px] text-start"> Тип </Label>
							<div class="col-span-3 flex flex-col gap-2">
								<Input id="type" type="text" v-bind="componentField" />
								<FormMessage />
							</div>
						</FormControl>
					</FormItem>
				</FormField>
				<FormField v-slot="{ componentField }" name="moderator">
					<FormItem>
						<Select v-bind="componentField">
							<FormControl>
								<SelectTrigger>
									<SelectValue placeholder="Выберите модератора" />
								</SelectTrigger>
							</FormControl>
							<SelectContent>
								<SelectGroup>
									<SelectLabel>Модераторы</SelectLabel>
									<SelectItem v-for="moderator in userStore.moderatorsGetter" :key="moderator.id" :value="moderator.id"> {{ moderator.name }} </SelectItem>
								</SelectGroup>
							</SelectContent>
						</Select>
						<FormMessage />
					</FormItem>
				</FormField>
			</div>
			<DialogFooter> <Button @click="createLead">Создать</Button> </DialogFooter>
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

  const props = defineProps({
    documents: {
      type: Object,
      required: true,
    },
    counterpartyId: {
      type: Number,
      required: true,
    },
    getFunction: {
      type: Function,
      required: true,
    },
  });

	const adminStore = useAdminStore();
	const userStore = useUserStore();

	const typeOfLead = ref("Двухстороннее соглашение");
	const isDialogOpen = ref(false);

	const formSchema = toTypedSchema(
		z.object({
			name: z.string().min(2).max(120),
			type: z.string().min(2).max(50).default(typeOfLead.value),
			moderator: z.number().min(1).max(50),
		})
	);

	const form = useForm({
		validationSchema: formSchema,
	});

	const createLead = form.handleSubmit(async (values) => {
		try {
			let response = ref();
			response.value = await adminStore.createLead({
				name: values.name,
				type: values.type,
				status: "Информационный",
				authorId: userStore.userGetter.id,
				counterpartyId: props.counterpartyId,
				moderatorsId: values.moderator,
				documents: props.documents,
			});
      props.getFunction();
			isDialogOpen.value = false;
		} catch (error: any) {
			const { toast } = useToast();
			console.log(error);

			if (error.message) {
				toast({
					title: "Ошибка",
					description: error.message,
					variant: "destructive",
				});
			} else {
				toast({
					title: "Неизвестная ошибка",
					description: "Попробуйте позже",
					variant: "destructive",
				});
			}
		}
	});

	watch(isDialogOpen, async (newVal) => {
		if (newVal) {
			await userStore.getModerators();
		}
	});
</script>

<style scoped></style>

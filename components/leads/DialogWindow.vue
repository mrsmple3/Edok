<template>
	<Dialog v-model:open="isDialogOpen">
		<DialogTrigger> Добавить спецификацию </DialogTrigger>
		<DialogContent>
			<DialogHeader>
				<DialogTitle>Добавить спецификацию</DialogTitle>
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
				<FormField name="quantity" v-slot="{ componentField }">
					<FormItem class="grid grid-cols-4 items-center gap-4">
						<FormControl>
							<Label for="quantity" class="text-[12px] text-start"> Количество ст... </Label>
							<div class="col-span-3 flex flex-col gap-2">
								<Input id="quantity" class="" type="number" v-bind="componentField" />
								<FormMessage />
							</div>
						</FormControl>
					</FormItem>
				</FormField>
				<div class="grid grid-cols-4 items-center gap-4">
					<Label for="documents" class="text-[12px] text-start"> Документы </Label>
					<Input id="documents" type="file" accept="application/pdf" @change="handleFileChange" multiple class="col-span-3" />
				</div>
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
	import { useCounterpartyStore } from "~/store/counterparty.store";
	import { useUserStore } from "~/store/user.store";
	import { useToast } from "~/components/ui/toast";
	import type { Document } from "~/store/user.store";

	const counterpartyStore = useCounterpartyStore();
	const userStore = useUserStore();

	const typeOfLead = ref("Двухстороннее соглашение");
	const uploadedFiles = ref<File[]>([]);
	const isDialogOpen = ref(false);

	const handleFileChange = (event: Event) => {
		const target = event.target as HTMLInputElement;
		if (target.files) {
			for (let i = 0; i < target.files.length; i++) {
				uploadedFiles.value.push(target.files[i]);
			}
		}
	};

	const formSchema = toTypedSchema(
		z.object({
			name: z.string().min(2).max(120),
			type: z.string().min(2).max(50).default(typeOfLead.value),
			quantity: z.number().min(2).max(50),
			moderator: z.number().min(1).max(50),
		})
	);

	const form = useForm({
		validationSchema: formSchema,
	});

	const createLead = form.handleSubmit(async (values) => {
		try {
			let response = ref();
			if (uploadedFiles.value) {
				response.value = [];
				for (let i = 0; i < uploadedFiles.value.length; i++) {
					const file = uploadedFiles.value[i];
					const document: any = await counterpartyStore.createDocument(
						{
							title: file.name,
							userId: userStore.userGetter.id,
							counterpartyId: userStore.userGetter.id,
							type: "act",
							status: "Информационный",
						},
						file
					);

					response.value.push(document);
				}
			}
			await counterpartyStore.createLead({
				name: values.name,
				type: values.type,
				status: "Информационный",
				quantity: values.quantity,
				authorId: userStore.userGetter.id,
				counterpartyId: userStore.userGetter.id,
				moderatorsId: values.moderator,
				documents: response.value.map((doc: Document) => doc.id),
			});
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

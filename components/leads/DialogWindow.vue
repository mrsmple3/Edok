<template>
	<Dialog v-model:open="isDialogOpen">
		<DialogTrigger
			class="flex-center gap-[11px] rounded-[14px] border border-[#2d9cdb] py-2 px-7 text-[#2d9cdb] text-[18px] font-bold font-['Barlow'] mr-[24px] hover:active">
			<img alt="plus" class="w-[19px] h-[19px]" src="/icons/plus-blue.svg" />
			Додати Угоду
		</DialogTrigger>
		<DialogContent>
			<DialogHeader>
				<DialogTitle>Додати Угоду</DialogTitle>
				<DialogDescription> Заповніть поля угоди </DialogDescription>
			</DialogHeader>
			<div class="grid gap-4 py-4">
				<FormField name="name" v-slot="{ componentField }">
					<FormItem class="grid grid-cols-4 items-center gap-4">
						<FormControl>
							<Label for="name" class="text-[12px] text-start"> Назва </Label>
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
				<div class="grid grid-cols-4 items-center gap-4">
					<Label for="documents" class="text-[12px] text-start"> Документи </Label>
					<Input id="documents" type="file" accept="application/pdf" @change="handleFileChange" multiple
						class="col-span-3" />
				</div>
				<FormField v-slot="{ componentField }" name="moderator">
					<FormItem>
						<Select v-bind="componentField">
							<FormControl>
								<SelectTrigger>
									<SelectValue placeholder="Оберіть модератора" />
								</SelectTrigger>
							</FormControl>
							<SelectContent>
								<SelectGroup>
									<SelectLabel>Модератори</SelectLabel>
									<SelectItem v-for="moderator in userStore.moderatorsGetter" :key="moderator.id" :value="moderator.id">
										{{ moderator.name }} </SelectItem>
								</SelectGroup>
							</SelectContent>
						</Select>
						<FormMessage />
					</FormItem>
				</FormField>
				<FormField v-slot="{ componentField }" name="counterparty">
					<FormItem>
						<Select v-bind="componentField">
							<FormControl>
								<SelectTrigger>
									<SelectValue placeholder="Оберіть контрагента" />
								</SelectTrigger>
							</FormControl>
							<SelectContent>
								<SelectGroup>
									<SelectLabel>Контрагенти</SelectLabel>
									<SelectItem v-for="counterparty in userStore.counterpartiesGetter" :key="counterparty.id"
										:value="counterparty.id">
										{{ counterparty.name || counterparty.organization_name }}
									</SelectItem>
								</SelectGroup>
							</SelectContent>
						</Select>
						<FormMessage />
					</FormItem>
				</FormField>
			</div>
			<DialogFooter> <Button @click="createLead">Створити</Button> </DialogFooter>
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
		moderator: z.number().min(1).max(50),
		counterparty: z.number().min(1).max(50),
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
				const document: any = await adminStore.createDocument(
					{
						title: file.name,
						userId: userStore.userGetter.id,
						counterpartyId: values.counterparty,
						moderatorId: values.moderator,
						type: "act",
						content: "Информационный",
					},
					file
				);

				response.value.push(document);
			}
		}
		await adminStore.createLead({
			name: values.name,
			type: values.type,
			authorId: userStore.userGetter.id,
			counterpartyId: values.counterparty,
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
		await userStore.getCounterparties();
	}
});
</script>

<style scoped></style>

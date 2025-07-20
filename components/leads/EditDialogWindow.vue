<template>
	<Dialog v-model:open="isDialogOpen">
		<DialogTrigger> Змінити </DialogTrigger>
		<DialogContent>
			<DialogHeader>
				<DialogTitle>Змінити договір</DialogTitle>
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
									<SelectItem v-for="moderator in userStore.moderatorsGetter" :key="moderator.id" :value="moderator.id"> {{ moderator.name }} </SelectItem>
								</SelectGroup>
							</SelectContent>
						</Select>
						<FormMessage />
					</FormItem>
				</FormField>
			</div>
			<DialogFooter> <Button @click="updateLead">Змінити</Button> </DialogFooter>
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
	import type { Document, Lead } from "~/store/user.store";
	import { useAdminStore } from "~/store/admin.store";

	const props = defineProps({
		invoice: {
			type: Object,
			required: true,
		},
	});

	const adminStore = useAdminStore();
	const userStore = useUserStore();

	const isDialogOpen = ref(false);

	const formSchema = toTypedSchema(
		z.object({
			name: z.string().min(2).max(120).default(props.invoice.name),
			type: z.string().min(2).max(50).default(props.invoice.type),
			moderator: z.number().min(1).max(50).default(props.invoice.moderators.id),
		})
	);

	const form = useForm({
		validationSchema: formSchema,
	});

	const updateLead = form.handleSubmit(async (values) => {
		try {
			await adminStore
				.updateLead({
					id: props.invoice.id,
					type: values.type,
					moderatorsId: values.moderator,
					name: values.name,
				})
				.then(async () => {
					isDialogOpen.value = false;
				});
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

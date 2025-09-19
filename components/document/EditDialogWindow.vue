<template>
	<Dialog v-model:open="isDialogOpen">
		<DialogTrigger> Змінити </DialogTrigger>
		<DialogContent>
			<DialogHeader>
				<DialogTitle>Змінити договір</DialogTitle>
				<DialogDescription> Заповніть поля угоди</DialogDescription>
			</DialogHeader>
			<div class="grid gap-4 py-4">
				<FormField name="title" v-slot="{ componentField }">
					<FormItem class="grid grid-cols-4 items-center gap-4">
						<FormControl>
							<Label for="title" class="form-label text-start"> Назва </Label>
							<div class="col-span-3 flex flex-col gap-2">
								<Input id="title" type="text" v-bind="componentField" />
								<FormMessage />
							</div>
						</FormControl>
					</FormItem>
				</FormField>
				<FormField name="type" v-slot="{ componentField }">
					<FormItem class="grid grid-cols-4 items-center gap-4">
						<FormControl>
							<Label for="type" class="form-label text-start"> Тип </Label>
							<div class="col-span-3 flex flex-col gap-2">
								<Input id="type" type="text" v-bind="componentField" />
								<FormMessage />
							</div>
						</FormControl>
					</FormItem>
				</FormField>
				<FormField name="status" v-slot="{ componentField }">
					<FormItem class="grid grid-cols-4 items-center gap-4">
						<FormControl>
							<Label for="status" class="form-label text-start"> Стан </Label>
							<div class="col-span-3 flex flex-col gap-2">
								<Input id="status" type="text" v-bind="componentField" />
								<FormMessage />
							</div>
						</FormControl>
					</FormItem>
				</FormField>
				<FormField name="content" v-slot="{ componentField }">
					<FormItem class="grid grid-cols-4 items-center gap-4">
						<FormControl>
							<Label for="content" class="form-label text-start"> Контент </Label>
							<div class="col-span-3 flex flex-col gap-2">
								<Input id="content" type="text" v-bind="componentField" />
								<FormMessage />
							</div>
						</FormControl>
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
		title: z.string().min(2).max(120).default(props.invoice.title),
		type: z.string().min(2).max(50).default(props.invoice.type),
		status: z.string().min(2).max(50).default(props.invoice.status),
		content: z.string().min(2).max(50).default(props.invoice.content),
	})
);

const form = useForm({
	validationSchema: formSchema,
});

const updateLead = form.handleSubmit(async (values) => {
	try {
		await adminStore
			.updateDocument({
				id: props.invoice.id,
				title: values.title,
				type: values.type,
				status: values.status,
				content: values.content,
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
	}
});
</script>

<style scoped lang="scss">
.form-label {
	font-size: size(12px);
}
</style>

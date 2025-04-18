<template>
	<form class="flex flex-col items-center" @submit.prevent="onSubmitRegister">
		<div class="w-full flex flex-col items-stretch gap-[13px] mb-[40px]">
			<FormField v-slot="{ componentField }" name="orgName">
				<FormItem>
					<FormControl>
						<Input class="form__input" placeholder="Назва організації" type="text" v-bind="componentField" />
					</FormControl>
					<FormMessage />
				</FormItem>
			</FormField>
			<FormField v-slot="{ componentField }" name="orgIIN">
				<FormItem>
					<FormControl>
						<Input class="form__input" placeholder="ІПН організації" type="text" v-bind="componentField" />
					</FormControl>
					<FormMessage />
				</FormItem>
			</FormField>
			<FormField v-slot="{ componentField }" name="email">
				<FormItem>
					<FormControl>
						<Input class="form__input" placeholder="Адреса електронної пошти или телефонный номер" type="text" v-bind="componentField" />
					</FormControl>
					<FormMessage />
				</FormItem>
			</FormField>
			<FormField name="file">
				<FormItem>
					<FormControl>
						<Input class="form__input" type="file" accept="application/pdf" multiple @change="handleFileChange" />
					</FormControl>
					<FormMessage />
				</FormItem>
			</FormField>
			<FormField v-slot="{ componentField }" name="password">
				<FormItem>
					<FormControl>
						<Input class="form__input" placeholder="Пароль" type="text" v-bind="componentField" />
					</FormControl>
					<FormMessage />
				</FormItem>
			</FormField>
		</div>
		<Button class="form__submit-btn" type="submit">Зарегистрироватся</Button>
	</form>
</template>

<script setup lang="ts">
	import { useForm } from "vee-validate";
	import { toTypedSchema } from "@vee-validate/zod";
	import * as z from "zod";
	import { useUserStore, type Document } from "~/store/user.store";
	import { useToast } from "./ui/toast";
	import { useCounterpartyStore } from "~/store/counterparty.store";

	const authStore = useUserStore();
	const counterpartyStore = useCounterpartyStore();
	const router = useRouter();

	const uploadedFiles = ref<File[]>([]);

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
			email: z
				.string()
				.min(2)
				.max(50)
				.refine(
					(value) => {
						const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
						const phoneRegex = /^\+?[1-9]\d{1,14}$/;
						return emailRegex.test(value) || phoneRegex.test(value);
					},
					{
						message: "Введите корректный email или телефонный номер",
					}
				),
			password: z.string().min(4).max(50),
			orgName: z.string().min(2).max(50),
			orgIIN: z.string().min(10).max(50),
		})
	);

	const form = useForm({
		validationSchema: formSchema,
	});

	const onSubmitRegister = form.handleSubmit(async (values) => {
		try {
			let response = ref();
			const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
			if (emailRegex.test(values.email)) {
				response.value = await authStore.register({
					organization_INN: values.orgIIN,
					organization_name: values.orgName,
					email: values.email,
					password_hash: values.password,
					role: "counterparty",
				});
			} else {
				response.value = await authStore.register({
					organization_INN: values.orgIIN,
					organization_name: values.orgName,
					phone: values.email,
					password_hash: values.password,
					role: "counterparty",
				});
			}

			await authStore.initAuth().then(async () => {
				response.value = [];
				if (uploadedFiles.value) {
					for (let i = 0; i < uploadedFiles.value.length; i++) {
						const file = uploadedFiles.value[i];
						const document: any = await counterpartyStore.createDocument(
							{
								title: file.name,
								userId: authStore.userGetter.id,
								counterpartyId: authStore.userGetter.id,
								type: "Спецификация",
								status: "Информационный",
							},
							file
						);

						response.value.push(document);
					}
				} else {
					// TODO: add some logic for leads
				}
				router.push("/leads");
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
</script>

<style scoped></style>

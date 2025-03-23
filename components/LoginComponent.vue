<template>
	<form class="flex flex-col items-center" @submit.prevent="onSubmitLogin">
		<div class="w-full flex flex-col items-stretch gap-[13px] mb-[40px]">
			<FormField v-slot="{ componentField }" name="email">
				<FormItem>
					<FormControl>
						<Input class="form__input" placeholder="Адреса електронної пошти" type="text" v-bind="componentField" />
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
		<Button class="form__submit-btn" type="submit">Увійти</Button>
	</form>
</template>

<script setup lang="ts">
	import { useForm } from "vee-validate";
	import { toTypedSchema } from "@vee-validate/zod";
	import * as z from "zod";
	import { useUserStore } from "~/store/user.store";
	import { useToast } from "./ui/toast";
	import ToastAction from "./ui/toast/ToastAction.vue";
	import { useCounterpartyStore } from "~/store/counterparty.store";

	const authStore = useUserStore();
	const counterpartyStore = useCounterpartyStore();

	const router = useRouter();

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
		})
	);

	const form = useForm({
		validationSchema: formSchema,
	});

	const onSubmitLogin = form.handleSubmit(async (values) => {
		try {
			let response = ref();
			const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
			if (emailRegex.test(values.email)) {
				response.value = await authStore.login({
					email: values.email,
					password_hash: values.password,
				});
			} else {
				response.value = await authStore.login({
					phone: values.email,
					password_hash: values.password,
				});
			}
			await authStore.initAuth().then(async () => {
				await counterpartyStore.getLeadByUserId(authStore.userGetter.id);
				router.push("/leads");
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

<style scoped></style>

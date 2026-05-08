<template>
	<form class="flex flex-col items-center" @submit.prevent="onSubmitLogin">
		<div class="w-full flex flex-col items-stretch login-form-fields">
			<FormField v-slot="{ componentField }" name="email">
				<FormItem>
					<FormControl>
						<Input
							v-if="isPhoneLikeInput(componentField.modelValue)"
							v-mask="PHONE_MASK"
							class="form__input"
							placeholder="Email або номер телефону"
							type="tel"
							v-bind="componentField"
						/>
						<Input
							v-else
							class="form__input"
							placeholder="Email або номер телефону"
							type="text"
							v-bind="componentField"
						/>
					</FormControl>
					<FormMessage />
				</FormItem>
			</FormField>
			<FormField v-slot="{ componentField }" name="password">
				<FormItem>
					<FormControl>
						<Input class="form__input" placeholder="Пароль" type="password" v-bind="componentField" />
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
import { useCounterpartyStore } from "~/store/counterparty.store";
import { useAdminStore } from "~/store/admin.store";
import { isPhoneLikeInput, isValidEmail, isValidPhone, normalizeEmail, normalizePhone, PHONE_MASK } from "~/lib/authIdentifier";

const authStore = useUserStore();
const counterpartyStore = useCounterpartyStore();
const adminStore = useAdminStore();

const router = useRouter();

const { toast } = useToast();


const formSchema = toTypedSchema(
	z.object({
		email: z
			.string()
			.min(2)
			.max(55)
			.refine(
				(value) => isValidEmail(value) || isValidPhone(value),
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
		const normalizedEmail = normalizeEmail(values.email);
		const normalizedPhone = normalizePhone(values.email);
		const cleanPassword = values.password.replace(/\s/g, '');

		let response;
		if (isValidEmail(normalizedEmail)) {
			console.log('Logging in with email:', normalizedEmail);

			response = await authStore.login({
				email: normalizedEmail!,
				password_hash: cleanPassword,
			});
		} else {
			console.log('Logging in with phone:', normalizedPhone);
			response = await authStore.login({
				phone: normalizedPhone!,
				password_hash: cleanPassword,
			});
		}
		await authStore.initAuth().then(async () => {
			console.log(authStore.$state.user);
			if (authStore.$state.user.role === "lawyer") {
				router.push("/docs");
			} else if (authStore.$state.user.role !== "counterparty") {
				await adminStore.getUserByRole('counterparty');
				router.push("/contacts");
			} else if (authStore.$state.user.role === "counterparty") {
				await counterpartyStore.getLeadByUserId(authStore.userGetter.id);
				router.push("/leads");
			} else {
				toast({
					title: "Попередження",
					description: 'У вас немає відповідної ролі',
					variant: "default",
				});
			}
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
.login-form-fields {
	gap: size(13px);
	margin-bottom: size(40px);
}
</style>

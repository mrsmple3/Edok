<template>
	<div class="page-container">
		<div class="w-full flex-center justify-between mb-[18px]">
			<div class="flex-center">
				<h2 class="page__title mr-[32px]">Контакты</h2>

				<button
					class="submenu-parent relative flex-center gap-[11px] rounded-[14px] border border-[#2d9cdb] py-2 px-7 text-[#2d9cdb] text-[18px] font-bold font-['Barlow'] mr-[24px] hover:active"
					@click="router.push('/add-contact')">
					<img alt="plus" class="w-[19px] h-[19px] min-h-max min-w-max" src="/icons/plus-blue.svg" />
					Новый
					<div class="submenu">
						<span>Модератор</span>
						<span>Контрагент</span>
						<span>Бухгалтер</span>
						<span>Юрист</span>
					</div>
				</button>
				<button
					class="submenu-parent relative flex-center gap-[11px] rounded-[14px] border border-[#2d9cdb] py-2 px-7 text-[#2d9cdb] text-[18px] font-bold font-['Barlow'] mr-[24px] hover:active">
					<img alt="plus" class="w-[19px] h-[19px] min-h-max min-w-max" src="/icons/plus-blue.svg" />
					Редактировать
					<div class="submenu">
						<span @click="activate">Активизировать</span>
						<span @click="deleted">Удалить</span>
					</div>
				</button>
				<button
					class="submenu-parent relative flex-center gap-[11px] rounded-[14px] border border-[#2d9cdb] py-2 px-7 text-[#2d9cdb] text-[18px] font-bold font-['Barlow'] mr-[24px] hover:active">
					<img alt="plus" class="w-[19px] h-[19px] min-h-max min-w-max" src="/icons/plus-blue.svg" />
					Створити нову угоду
					<div class="submenu">
						<span>Добавить спецификацию</span>
						<span>Добавить счет</span>
						<span>Добавить накладную</span>
						<span>Добавить подтверждающие документы</span>
					</div>
				</button>
			</div>

			<div class="flex-center gap-[15px]">
				<Badge class="w-12 h-12 bg-[#2d9cdb]/20 rounded-[15px] hover:bg-[#2d9cdb]/30">
					<img alt="filter" src="/icons/filter.svg" />
				</Badge>
				<RefreshData :refreshFunction="async () => await adminStore.getUserByRole(selectedRole)" />
			</div>
		</div>
		<div class="flex-center gap-[5px] mb-[26px]">
			<NuxtLink class="breadcrumbs" to="">Контакты</NuxtLink>
		</div>
		<div class="page__block relative pt-[40px] pb-[40px] px-[42px]">
			<Select defaultValue="counterparty">
				<SelectTrigger class="w-[180px] absolute top-1 right-1 z-10">
					<SelectValue placeholder="Пользователи" />
				</SelectTrigger>
				<SelectContent>
					<SelectGroup>
						<SelectItem v-for="role in getRoles()" :key="role.id" :value="role.value"
							@select="onSelectUser(role.value)">
							{{ role.name }}
						</SelectItem>
					</SelectGroup>
				</SelectContent>
			</Select>
			<ContactTable ref="contactTableRef" :tableData="adminStore.$state.users" />
		</div>
	</div>
</template>

<script lang="ts" setup>
import roles from "~/assets/data/roles.json";
import { useToast } from "~/components/ui/toast";
import { useAdminStore } from "~/store/admin.store";
import { useUserStore } from "~/store/user.store";

definePageMeta({
	layout: "page",
});

const router = useRouter();
const route = useRoute();

const adminStore = useAdminStore();
const userStore = useUserStore();

const contactTableRef = ref(null);

const selectedRole = ref("counterparty");

const onSelectUser = async (role: string) => {
	await adminStore.getUserByRole(role).then(() => {
		selectedRole.value = role;
	})
};

onBeforeMount(() => {
	watch(
		() => [userStore.isAuthInitialized, route.fullPath],
		async ([newVal, changedRoute]) => {
			if (newVal) {
				await adminStore.getUserByRole(selectedRole.value);
			}
		},
		{
			immediate: true,
		}
	);
});

const getRoles = (): { id: string; name: string; value: string }[] => {
	const userRole = userStore.userGetter.role;

	const filteredRoles = roles.filter((role) => {
		if (userRole === "admin") return role.value !== "admin";
		return role.value === "counterparty";
	});
	return filteredRoles;
};

const activate = () => {
	if (contactTableRef.value) {
		contactTableRef.value.activateUsers();
	} else {
		console.error("contactTableRef is null or undefined.");
	}
}

const deleted = () => {
	if (contactTableRef.value) {
		contactTableRef.value.deleteUsers();
	} else {
		console.error("contactTableRef is null or undefined.");
	}
}
</script>

<style lang="scss" scoped></style>

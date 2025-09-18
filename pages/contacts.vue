<template>
	<div class="page-container">
		<div class="w-full flex-center justify-between mb-[18px]">
			<div class="flex-center">
				<h2 class="page__title mr-[32px]">Контакти</h2>

				<button v-if="userStore.$state.user.role !== 'boogalter'"
					class="submenu-parent relative flex-center gap-[11px] rounded-[14px] border border-[#2d9cdb] py-2 px-7 text-[#2d9cdb] text-[18px] font-bold font-['Barlow'] mr-[24px] hover:active">
					<img alt="plus" class="w-[19px] h-[19px] min-h-max min-w-max" src="/icons/plus-blue.svg" />
					Новий
					<div class="submenu">
						<span @click="router.push({ path: '/add-contact', query: { role: 'moderator' } })">Модератор</span>
						<span @click="router.push({ path: '/add-contact', query: { role: 'counterparty' } })">Контрагент</span>
						<span @click="router.push({ path: '/add-contact', query: { role: 'boogalter' } })">Бухгалтер</span>
						<span @click="router.push({ path: '/add-contact', query: { role: 'lawyer' } })">Юрист</span>
					</div>
				</button>
				<button
					class="submenu-parent relative flex-center gap-[11px] rounded-[14px] border border-[#2d9cdb] py-2 px-7 text-[#2d9cdb] text-[18px] font-bold font-['Barlow'] mr-[24px] hover:active">
					<img alt="plus" class="w-[19px] h-[19px] min-h-max min-w-max" src="/icons/plus-blue.svg" />
					Редагувати
					<div class="submenu">
						<span @click="activate">Активізувати</span>
						<span @click="deleted">Видалити</span>
					</div>
				</button>
			</div>

			<div class="flex-center gap-[15px]">
				<!-- <Badge class="w-12 h-12 bg-[#2d9cdb]/20 rounded-[15px] hover:bg-[#2d9cdb]/30">
					<img alt="filter" src="/icons/filter.svg" />
				</Badge> -->
				<RefreshData :refreshFunction="async () => await adminStore.getUserByRole(selectedRole)" />
			</div>
		</div>
		<div class="flex-center gap-[5px] mb-[26px]">
			<NuxtLink class="breadcrumbs" to="">Контакти</NuxtLink>
		</div>
		<div class="page__block relative py-[30px] px-[42px]">
			<Select defaultValue="counterparty" v-model="selectedRole">
				<SelectTrigger class="w-[180px] absolute top-1 right-1 z-10">
					<SelectValue placeholder="Користувачі" />
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
			<ContactTable ref="contactTableRef" :tableData="paginatedUsers" />
		</div>
		<Pagination class="pagination-class" v-slot="{ page }" :items-per-page="itemsPerPage"
			:total="adminStore.$state.users.length" :sibling-count="1" show-edges :default-page="1"
			@update:page="(newPage) => (currentPage = newPage)">
			<PaginationList v-slot="{ items }" class="flex items-center gap-1">
				<PaginationFirst />
				<PaginationPrev />

				<template v-for="(item, index) in items">
					<PaginationListItem v-if="item.type === 'page'" :key="index" :value="item.value" as-child>
						<Button class="w-9 h-9 p-0" :variant="item.value === page ? 'default' : 'outline'">
							{{ item.value }}
						</Button>
					</PaginationListItem>
					<PaginationEllipsis v-else :key="item.type" :index="index" />
				</template>

				<PaginationNext />
				<PaginationLast />
			</PaginationList>
		</Pagination>
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
		router.push({ path: '/contacts', query: { role: selectedRole.value } });
	})
};

const currentPage = ref(1); // Текущая страница
const itemsPerPage = 7; // Количество элементов на странице

// Получаем данные для текущей страницы
const paginatedUsers = computed(() => {
	const start = (currentPage.value - 1) * itemsPerPage;
	const end = start + itemsPerPage;
	return adminStore.$state.users.slice(start, end);
});

// Общее количество страниц
const totalPages = computed(() => {
	return Math.ceil(adminStore.$state.users.length / itemsPerPage);
});

onBeforeMount(() => {
	watch(
		() => [userStore.isAuthInitialized, route.fullPath],
		async ([newVal, changedRoute]) => {
			if (newVal) {
				await adminStore.getUserByRole(selectedRole.value);

				router.replace({
					path: route.path,
					query: {
						...route.query,
						role: selectedRole.value,
					},
				});
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

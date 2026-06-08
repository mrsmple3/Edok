<template>
	<div class="page-container">
		<LayoutPageToolbar title="Контакти">
			<template #actions>
				<button v-if="userStore.$state.user.role !== 'boogalter'"
					class="submenu-parent relative flex-center gap-[11px] rounded-field border border-brand-primary py-2 px-7 text-brand-primary text-[18px] font-bold mr-[24px]">
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
					class="submenu-parent relative flex-center gap-[11px] rounded-field border border-brand-primary py-2 px-7 text-brand-primary text-[18px] font-bold mr-[24px]">
					<img alt="plus" class="w-[19px] h-[19px] min-h-max min-w-max" src="/icons/plus-blue.svg" />
					Редагувати
					<div class="submenu">
						<span @click="activate">Активізувати</span>
						<span @click="deleted">Видалити</span>
					</div>
				</button>
			</template>

			<template #filters>
				<div class="relative">
					<Search class="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-ink-500 pointer-events-none" />
					<Input
						v-model="searchQuery"
						type="search"
						placeholder="Пошук за іменем, email, телефоном…"
						class="h-10 w-[280px] pl-9 rounded-field border-brand-primary/40 focus-visible:ring-brand-primary focus-visible:ring-offset-0"
					/>
				</div>
				<Select defaultValue="counterparty" v-model="selectedRole">
					<SelectTrigger class="w-[180px] h-10 rounded-field border-brand-primary/40">
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
				<RefreshData :refreshFunction="async () => await usersStore.getUserByRole(selectedRole)" />
			</template>
		</LayoutPageToolbar>
		<div class="flex-center gap-[5px] mb-[26px]">
			<NuxtLink class="breadcrumbs" to="">Контакти</NuxtLink>
		</div>
		<div class="page__block py-[30px] px-[42px]">
			<ContactTable ref="contactTableRef" :tableData="paginatedUsers" />
			<div v-if="filteredUsersCount === 0" class="py-[40px] text-center text-ink-500 text-base">
				{{ searchQuery ? 'Нічого не знайдено за вашим запитом' : 'Список порожній' }}
			</div>
		</div>
		<Pagination class="pagination-class" v-slot="{ page }" :items-per-page="itemsPerPage"
			:total="filteredUsersCount" :sibling-count="1" show-edges :default-page="currentPage"
			@update:page="onPageChange">
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
import type { User } from "@prisma/client";
import { Search } from "lucide-vue-next";
import roles from "~/assets/data/roles.json";
import { byCreatedAtDesc, usePagedList } from "~/composables/usePagedList";
import { useUsersStore } from "~/store/users.store";
import { useUserStore } from "~/store/user.store";

definePageMeta({
	layout: "page",
});

const router = useRouter();
const route = useRoute();

const usersStore = useUsersStore();
const userStore = useUserStore();
const { withLoader } = usePageLoader();

const contactTableRef = ref<{ activateUsers: () => void; deleteUsers: () => void } | null>(null);

const getRoleFromQuery = (value: string | string[] | undefined) => {
	const roleValue = Array.isArray(value) ? value[0] : value;
	return typeof roleValue === "string" && roleValue.length > 0 ? roleValue : "counterparty";
};

const selectedRole = ref(getRoleFromQuery(route.query.role));
const searchQuery = ref("");

const usersSource = computed<User[]>(() => usersStore.users);

const matchesSearch = (u: User): boolean => {
	const q = searchQuery.value.trim().toLowerCase();
	if (!q) return true;
	const fields = [
		u.name,
		u.surname,
		u.patronymic,
		u.organization_name,
		u.email,
		u.phone,
		String(u.id ?? ""),
	];
	return fields.some((v) => typeof v === "string" && v.toLowerCase().includes(q));
};

const {
	currentPage,
	itemsPerPage,
	totalItems: filteredUsersCount,
	paginated: paginatedUsers,
	onPageChange,
	resetPage,
} = usePagedList(usersSource, {
	pageSize: 9,
	sort: byCreatedAtDesc,
	filter: matchesSearch,
});

watch(searchQuery, () => {
	resetPage();
});

const onSelectUser = async (role: string) => {
	await withLoader(async () => {
		await usersStore.getUserByRole(role).then(() => {
			selectedRole.value = role;
			currentPage.value = 1;
			router.push({ path: "/contacts", query: { role: selectedRole.value } });
		});
	});
};

onBeforeMount(() => {
	watch(
		() => [userStore.isAuthInitialized, route.path, route.query.role],
		async ([isAuthInitialized]) => {
			if (isAuthInitialized) {
				selectedRole.value = getRoleFromQuery(route.query.role);

				await withLoader(async () => {
					await usersStore.getUserByRole(selectedRole.value);

					if (route.query.role !== selectedRole.value) {
						router.replace({
							path: route.path,
							query: {
								...route.query,
								role: selectedRole.value,
							},
						});
					}
				});
				callOnce(async () => {
					if (!userStore.$state.isAuth) {
						router.push("/login");
					}
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

const activate = () => contactTableRef.value?.activateUsers();
const deleted = () => contactTableRef.value?.deleteUsers();
</script>

<style lang="scss" scoped></style>

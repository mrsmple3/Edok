<template>
	<div class="page-container">
		<div class="w-full flex-center justify-between mb-[18px]">
			<div class="flex-center">
				<h2 class="page__title mr-[32px]">Організації</h2>
			</div>

			<div class="flex-center gap-[15px]">
				<RefreshData :refreshFunction="refreshOrganizations" />
			</div>
		</div>
		<div class="flex-center gap-[5px] mb-[26px]">
			<NuxtLink class="breadcrumbs" to="">Організації</NuxtLink>
		</div>
		<div class="page__block py-[30px] px-[42px]">
			<div class="mb-6 grid grid-cols-1 md:grid-cols-[1fr_1fr_auto] gap-4 items-end">
				<div class="flex flex-col gap-2">
					<label class="text-sm font-medium text-[#464154]">Назва організації</label>
					<Input v-model="form.name" placeholder="Введіть назву організації" />
				</div>
				<div class="flex flex-col gap-2">
					<label class="text-sm font-medium text-[#464154]">ЄДРПОУ</label>
					<Input v-model="form.inn" placeholder="Введіть ЄДРПОУ (за потреби)" />
				</div>
				<Button class="h-[44px] bg-[#2d9cdb] hover:bg-[#2d9cdb]/90" @click="createOrganization">
					Додати
				</Button>
			</div>

			<Table class="w-full">
				<TableHeader class="w-full h-[60px]">
					<TableRow class="border-none">
						<TableHead class="t-head">Назва</TableHead>
						<TableHead class="t-head">ЄДРПОУ</TableHead>
						<TableHead class="t-head">Створено</TableHead>
						<TableHead class="t-head">Дії</TableHead>
					</TableRow>
				</TableHeader>
				<TableBody v-if="organizations.length">
					<TableRow v-for="organization in organizations" :key="organization.id" class="hover:bg-[#2d9cdb]/20">
						<TableCell class="t-cell">{{ organization.name }}</TableCell>
						<TableCell class="t-cell">{{ organization.inn || "—" }}</TableCell>
						<TableCell class="t-cell">{{ formatDate(organization.createdAt) }}</TableCell>
						<TableCell class="t-cell">
							<div class="flex items-center gap-2">
								<Button variant="outline" class="h-8" @click="openOrganizationLeads(organization.id)">
									Перейти до угод
								</Button>
								<Button variant="destructive" class="h-8" @click="confirmDelete(organization.id, organization.name)">
									Видалити
								</Button>
							</div>
						</TableCell>
					</TableRow>
				</TableBody>
				<TableBody v-else>
					<TableRow>
						<TableCell class="t-cell text-center" colspan="4">
							Організацій ще немає.
						</TableCell>
					</TableRow>
				</TableBody>
			</Table>
		</div>
	</div>
</template>

<script lang="ts" setup>
import { useAdminStore } from "~/store/admin.store";
import { useToast } from "~/components/ui/toast";
import { useUserStore } from "~/store/user.store";

definePageMeta({
	layout: "page",
});

const adminStore = useAdminStore();
const userStore = useUserStore();
const router = useRouter();
const { withLoader } = usePageLoader();
const { toast } = useToast();

const form = reactive({
	name: "",
	inn: "",
});

const organizations = computed(() => adminStore.organizationsGetter || []);

const refreshOrganizations = async () => {
	await withLoader(async () => {
		await adminStore.getOrganizations();
	});
};

const createOrganization = async () => {
	const name = form.name.trim();
	const inn = form.inn.trim();

	if (!name) {
		toast({
			title: "Помилка",
			description: "Потрібно вказати назву організації",
			variant: "destructive",
		});
		return;
	}

	try {
		await adminStore.createOrganization({
			name,
			inn: inn || null,
		});
		form.name = "";
		form.inn = "";
	} catch (error: any) {
		toast({
			title: "Помилка",
			description: error?.message || "Не вдалося створити організацію",
			variant: "destructive",
		});
	}
};

const openOrganizationLeads = (organizationId: number) => {
	router.push({ path: "/leads", query: { organizationId } });
};

const confirmDelete = async (organizationId: number, name: string) => {
	if (!window.confirm(`Видалити організацію "${name}"?`)) {
		return;
	}

	try {
		await adminStore.deleteOrganization(organizationId);
	} catch (error: any) {
		toast({
			title: "Помилка",
			description: error?.message || "Не вдалося видалити організацію",
			variant: "destructive",
		});
	}
};

const formatDate = (date: string | Date) => {
	return new Date(date).toLocaleDateString("uk-UA");
};

onBeforeMount(async () => {
	watch(
		() => userStore.isAuthInitialized,
		async (ready) => {
			if (!ready) {
				return;
			}
			if (userStore.userRole === "counterparty") {
				await router.push("/leads");
				return;
			}
			await refreshOrganizations();
		},
		{ immediate: true }
	);
});
</script>

<style lang="scss" scoped></style>

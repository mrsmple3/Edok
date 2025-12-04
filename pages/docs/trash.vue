<template>
	<div class="page-container">
		<div class="w-full flex-center justify-between m-b-18">
			<div class="flex-center">
				<h2 class="page__title m-r-32">Корзина документів</h2>
			</div>

			<div class="flex-center gap-15">
				<RefreshData :refreshFunction="loadTrash" />
			</div>
		</div>

		<div class="flex-center gap-5 m-b-26">
			<NuxtLink class="breadcrumbs" to="/docs">Документи</NuxtLink>
			<span class="breadcrumbs__separator">/</span>
			<span class="breadcrumbs breadcrumbs--active">Корзина</span>
		</div>

		<div class="page__block p-y-30 p-x-42">
			<DocumentTrashTable v-if="trashDocuments.length" :documents="trashDocuments" @updated="loadTrash" />
			<NotFoundDocument v-else title="Корзина порожня"
				description="Тут будуть відображатися документи, видалення яких очікує підтвердження." />
		</div>
	</div>
</template>

<script setup lang="ts">
import { useAdminStore } from "~/store/admin.store";
import { useUserStore } from "~/store/user.store";

definePageMeta({
	layout: "page",
});

const adminStore = useAdminStore();
const userStore = useUserStore();
const { withLoader } = usePageLoader();

const trashDocuments = computed(() => adminStore.trashDocumentsGetter || []);
const isReady = computed(() => userStore.isAuthInitialized);

const loadTrash = async () => {
	const currentId = userStore.userGetter.id;
	if (!currentId) {
		return;
	}

	await withLoader(async () => {
		if (userStore.userGetter.role === "counterparty") {
			await adminStore.getTrashDocumentsByUserId(currentId);
		} else {
			await adminStore.getTrashDocuments();
		}
	});
};

watch(
	() => isReady.value,
	async (ready) => {
		if (ready) {
			await loadTrash();
		}
	},
	{ immediate: true },
);
</script>

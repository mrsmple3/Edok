<template>
	<div class="page-container">
		<div class="w-full flex-center justify-between mb-[18px]">
			<div class="flex-center">
				<h2 class="page__title mr-[32px]">Угоди</h2>
				<LeadsDialogWindow/>

				<!-- <div class="flex-center gap-6">
					<img alt="list" class="max-w-[24px] max-h-[24px] min-h-max min-w-max cursor-pointer" src="/icons/leads-icon-list-1.svg" />
					<img alt="list" class="max-w-[24px] max-h-[24px] min-h-max min-w-max cursor-pointer" src="/icons/leads-icon-list-2.svg" />
					<img alt="list" class="max-w-[24px] max-h-[24px] min-h-max min-w-max cursor-pointer" src="/icons/leads-icon-list-3.svg" />
					<img alt="list" class="max-w-[24px] max-h-[24px] min-h-max min-w-max cursor-pointer" src="/icons/leads-icon-list-4.svg" />
					<img alt="list" class="max-w-[24px] max-h-[24px] min-h-max min-w-max cursor-pointer" src="/icons/leads-icon-list-5.svg" />
				</div> -->
			</div>

			<div class="flex-center gap-[15px]">
				<Badge class="w-12 h-12 bg-[#2d9cdb]/20 rounded-[15px] hover:bg-[#2d9cdb]/30">
					<img alt="filter" src="/icons/filter.svg" />
				</Badge>
				<RefreshData :refreshFunction="async () => await adminStore.getLeadByUserId(userStore.userGetter.id)" />
			</div>
		</div>
		<div class="flex-center gap-[5px] mb-[26px]">
			<NuxtLink class="breadcrumbs" to="">Угоди</NuxtLink>
		</div>
		<div class="page__block pt-[40px] pb-[40px] px-[42px]">
			<LeadsFirstType v-if="adminStore.$state.leads.length > 0" :invoices="adminStore.$state.leads" />
			<NotFoundLead v-else />
		</div>
	</div>
</template>

<script lang="ts" setup>
import { useAdminStore } from "~/store/admin.store"
import { useUserStore } from "~/store/user.store"

definePageMeta({
	layout: "page",
})

const chatState = useState("isChat")

const route = useRoute()

const adminStore = useAdminStore()
const userStore = useUserStore()

onBeforeMount(async () => {
	watch(
		() => [userStore.isAuthInitialized, route.fullPath],
		async ([newVal, changedRoute]) => {
			if (newVal) {
				await adminStore.getLeadByUserId(userStore.userGetter.id)
			}
		},
		{
			immediate: true,
		}
	)
})
</script>

<style lang="scss" scoped></style>

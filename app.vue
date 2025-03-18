<template>
	<div>
		<NuxtLayout>
			<NuxtPage />
		</NuxtLayout>
		<Toaster />
	</div>
</template>

<script lang="ts" setup>
	import { useUserStore } from "~/store/user.store";

	const userStore = useUserStore();

	const router = useRouter();
	const route = useRoute();

	onBeforeMount(() => {
		callOnce(async () => {
			await userStore.initAuth().finally(() => {
				if (!userStore.isAuth) {
					router.push("/login");
				}
			});
		});
	});
</script>

<style lang="scss" scoped></style>

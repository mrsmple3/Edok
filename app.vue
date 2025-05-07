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
useHead({
	script: [
		{
			src: '/js/eusign.js',
			type: 'text/javascript',
		},
	],
});
onBeforeMount(() => {
	callOnce(async () => {
		await userStore.initAuth().finally(() => {
			if (!userStore.$state.isAuth) {
				router.push("/login");
			}
		});
	});
});
</script>

<style lang="scss" scoped></style>

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
import { useToast } from "~/components/ui/toast";

const userStore = useUserStore();

const router = useRouter();
const route = useRoute();
const { toast } = useToast();

onBeforeMount(() => {
	callOnce(async () => {
		await userStore.initAuth().finally(() => {
			console.log(userStore.userGetter);
			if (!userStore.$state.isAuth) {
				router.push("/login");
			}
		});
	});
});
</script>

<style lang="scss" scoped></style>

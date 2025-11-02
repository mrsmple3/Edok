<template>
	<div>
		<NuxtLayout>
			<NuxtPage />
		</NuxtLayout>
		<Toaster />
		<PageLoader />
	</div>
</template>

<script lang="ts" setup>
// Инициализация авторизации обрабатывается в middleware auth.ts
</script>

<style lang="scss" scoped></style>

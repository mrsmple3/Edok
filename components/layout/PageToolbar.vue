<script setup lang="ts">
defineProps<{
	title: string;
}>();
</script>

<template>
	<div class="w-full flex items-center justify-between mb-[18px] gap-[16px]">
		<div class="flex items-center flex-wrap gap-y-[10px]">
			<h2 class="page__title mr-[32px]">{{ title }}</h2>
			<slot name="actions" />
		</div>

		<div class="flex items-center gap-[12px] shrink-0">
			<slot name="filters" />
		</div>
	</div>
</template>

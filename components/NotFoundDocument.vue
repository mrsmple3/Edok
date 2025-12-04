<template>
	<div class="not-found">
		<img alt="not-found" class="min-h-max min-w-max not-found-icon" src="/icons/file-wrong_svgrepo.com.svg" />
		<h3 class="not-found-title text-[#464154] font-semibold font-['Barlow']">{{ title }}</h3>
		<p class="not-found-text text-center text-[#464154] font-light font-['Barlow']">{{ description }}</p>
	</div>
</template>

<script lang="ts" setup>
import { computed } from "vue";

const props = defineProps({
	title: {
		type: String,
		default: "Документів поки що немає",
	},
	description: {
		type: String,
		default: "Ще не були завантажені",
	},
});

const title = computed(() => props.title);
const description = computed(() => props.description);
</script>

<style lang="scss" scoped>
.not-found-icon {
	width: size(130px);
	height: size(164px);
	margin-bottom: size(44px);
}

.not-found-title {
	font-size: size(25px);
	margin-bottom: size(31px);
}

.not-found-text {
	width: size(950px);
	font-size: size(20px);
}
</style>

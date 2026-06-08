<script setup lang="ts">
import type { HTMLAttributes } from "vue";
import { cn } from "@/lib/utils";
import { Primitive, type PrimitiveProps } from "radix-vue";
import { type BrandButtonVariants, brandButtonVariants } from ".";

interface Props extends PrimitiveProps {
	variant?: BrandButtonVariants["variant"];
	size?: BrandButtonVariants["size"];
	class?: HTMLAttributes["class"];
}

const props = withDefaults(defineProps<Props>(), {
	as: "button",
});
</script>

<template>
	<Primitive
		:as="as"
		:as-child="asChild"
		:class="cn(brandButtonVariants({ variant, size }), props.class)"
	>
		<slot />
	</Primitive>
</template>

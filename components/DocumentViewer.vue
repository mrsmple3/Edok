import * as z from 'zod';
<template>
	<div class="document-viewer" @click.self="documentView = false">
		<div class="document-viewer__content">
			<iframe :src="getGoogleDocViewerUrl(documentUrl)" allow="autoplay" class="document-frame"></iframe>
		</div>
	</div>
</template>

<script lang="ts" setup>
	const props = defineProps<{
		documentUrl: string;
	}>();

	const documentView = useState("isDocumentView");

	const getGoogleDocViewerUrl = (url: string) => {
		return encodeURI(url);
	};
</script>

<style lang="scss" scoped>
	.document-viewer {
		position: fixed;
		inset: 0;
		@include flex-center();
		justify-content: center;
		background: rgba(0, 0, 0, 0.5);
		z-index: 1000;
	}
	.document-viewer__content {
		width: 60vw;
		height: 80vh;
	}

	.document-frame {
		width: 100%;
		height: 100%;
		border: none;
	}
</style>

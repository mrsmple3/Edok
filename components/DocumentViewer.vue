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
	// const docUrl = 'http://localhost:3000/uploads/24-02-2025/электронная подпись-1740380695996-608591356.pdf';
	// 'https://docs.google.com/document/d/1BGyxBeKzbY0leDOc6QwRAMcWXG6dwPQn/edit?usp=sharing&ouid=101295484825063391174&rtpof=true&sd=true'
	// 'http://localhost:3000/uploads/23-02-2025/2.1%20%D0%90%D1%80%D1%85%D0%B8%D1%82%D0%B5%D0%BA%D1%82%D1%83%D1%80%D0%BD%D1%8B%D0%B8%CC%86_%D0%B4%D0%BE%D0%BA%D1%83%D0%BC%D0%B5%D0%BD%D1%82_%D0%AD%D1%82%D0%B0%D0%BF_1-1740334982338-346621630.docx'
	// 'http://localhost:3000/uploads/24-02-2025/электронная подпись-1740380695996-608591356.pdf'

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

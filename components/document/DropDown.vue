<template>
	<DropdownMenu>
		<DropdownMenuTrigger class="absolute inset-0 w-full h-full"></DropdownMenuTrigger>
		<DropdownMenuContent align="end">
			<DropdownMenuItem @select="openDocument">Показати документи</DropdownMenuItem>
			<DropdownMenuItem class="text-yellow-700" @select="handleSelect">
				<DocumentEditDialogWindow :invoice="invoice" />
			</DropdownMenuItem>
			<DropdownMenuItem @select="handleSelectSign">
				<DocumentSignDialogWindow />
			</DropdownMenuItem>
			<!-- <DropdownMenuItem @select="handleSelectSign">
				<DocumentDownload :invoice="invoice" />
			</DropdownMenuItem> -->
			<DropdownMenuItem @select="handleSelectSign">
				<DocumentProtocol :invoice="invoice" />
			</DropdownMenuItem>
			<!-- <DropdownMenuItem class="text-blue-600" @click="redirectToESign()">Перейти на подпись</DropdownMenuItem> -->
			<DropdownMenuItem class="text-red-600" @click="deleteDocument(invoice)">Видалити</DropdownMenuItem>
		</DropdownMenuContent>
	</DropdownMenu>
</template>

<script setup lang="ts">
import { useToast } from "~/components/ui/toast";
import { useAdminStore } from "~/store/admin.store";
import { useUserStore } from "~/store/user.store";

const props = defineProps({
	invoice: {
		type: Object,
		required: true,
	},
});

const router = useRouter();
const adminStore = useAdminStore();
const userStore = useUserStore();
const { toast } = useToast();


const documentView = useState("isDocumentView");
const documentUrl = useState("documentUrl");
const openDocument = (event: Event) => {
	if (props.invoice.status === "Підписано") {
		documentUrl.value = props.invoice.Signature[props.invoice.Signature.length - 1].stampedFile;
	} else {
		documentUrl.value = props.invoice.filePath;
	}
	documentView.value = true;
};

const handleSelect = (event: Event) => {
	event.preventDefault();
};

const handleSelectSign = (event: Event) => {
	event.preventDefault();
	const currentQuery = { ...router.currentRoute.value.query };
	router.push({
		query: {
			...currentQuery,
			documentSign: props.invoice.id
		}
	});
};

const deleteDocument = async (invoice: any) => {
	try {
		const reponse = await adminStore.deleteDocument(userStore.userGetter.id, invoice.id);
		toast({
			title: "Успех",
			description: reponse,
			variant: "default",
		});
	}
	catch (error: any) {
		console.log(error);

		if (error.message) {
			toast({
				title: "Помилка",
				description: error.message,
				variant: "destructive",
			});
		} else {
			toast({
				title: "Невідома помилка",
				description: "Спробуйте пізніше",
				variant: "destructive",
			});
		}
	}
};
</script>

<style scoped></style>

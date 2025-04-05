<template>
	<Table class="w-full">
		<TableHeader class="w-full h-[80px]">
			<TableRow class="border-none">
				<TableHead class="t-head">
					<Checkbox :checked="isAllActive" class="bg-[#FFFFFF] border-[#DBDBDB]"
						@update:checked="toggleAllCheckboxes" />
				</TableHead>
				<TableHead class="t-head">Название</TableHead>
				<TableHead class="t-head">Код</TableHead>
				<TableHead class="t-head">Стан контакту</TableHead>
				<TableHead class="t-head">Електронна адреса</TableHead>
				<TableHead class="t-head">Телефон</TableHead>
				<TableHead class="t-head">Активність</TableHead>
			</TableRow>
		</TableHeader>
		<TableBody class="w-full">
			<TableRow v-for="(invoice, index) in tableData" :key="index" :class="{ 'opacity-50': !invoice.isActive }"
				class="relative hover:bg-[#2d9cdb]/20">
				<TableCell class="px-2 w-5">
					<Checkbox :checked="checkBoxUsers[index]?.id !== null"
						class="bg-[#FFFFFF] border-[#DBDBDB] absolute top-1/2 -translate-y-1/2 z-[10]"
						@update:checked="updateCheckbox(index, invoice.id)" />
				</TableCell>
				<TableCell class="w-[300px] t-cell text-[17px]">{{ invoice.organization_name }}</TableCell>
				<TableCell class="t-cell">{{ invoice.id }}</TableCell>
				<TableCell class="t-cell">{{ invoice.role }}</TableCell>
				<TableCell class="t-cell">{{ invoice.email ? invoice.email : "Не задано" }}</TableCell>
				<TableCell class="t-cell">{{ invoice.phone ? invoice.phone : "Не задано" }}</TableCell>
				<TableCell class="t-cell">{{ new Date(invoice.createdAt).toLocaleDateString("ru-RU") }}</TableCell>
				<ContactsDropDown :invoice="invoice" />
			</TableRow>
		</TableBody>
	</Table>
</template>

<script lang="ts" setup>
import { useAdminStore } from '~/store/admin.store';
import { useToast } from './ui/toast';

const props = defineProps({
	tableData: {
		type: Object,
		required: true,
	},
});

const isAllActive = ref(false);

const adminStore = useAdminStore();

const checkBoxUsers = ref(
	props.tableData.map(() => ({
		id: null,
	}))
);

watch(
	() => props.tableData,
	(newTableData) => {
		checkBoxUsers.value = newTableData.map(() => ({
			id: null,
		}));
	},
	{ immediate: true }
);

const updateCheckbox = (index: number, id: any) => {
	checkBoxUsers.value[index].id = checkBoxUsers.value[index].id === null ? id : null;
};

const toggleAllCheckboxes = () => {
	const newState = !isAllActive.value;
	isAllActive.value = newState;

	checkBoxUsers.value = props.tableData.map((item: any) => ({
		id: newState ? item.id : null,
	}));
};

const activateUsers = async () => {
	try {
		await Promise.all(
			checkBoxUsers.value.map(async (user: any) => {
				if (user.id !== null) {
					await adminStore.updateUser({
						id: user.id,
						isActive: true,
					});
				}
			})
		);
	} catch (error: any) {
		const { toast } = useToast();
		console.log(error);

		if (error.message) {
			toast({
				title: "Ошибка",
				description: error.message,
				variant: "destructive",
			});
		} else {
			toast({
				title: "Неизвестная ошибка",
				description: "Попробуйте позже",
				variant: "destructive",
			});
		}
	}
};

const deleteUsers = async () => {
	try {
		await Promise.all(
			checkBoxUsers.value.map(async (user: any) => {
				if (user.id !== null) {
					await adminStore.deleteUser(user.id);
				}
			})
		);
	} catch (error: any) {
		const { toast } = useToast();
		console.log(error);

		if (error.message) {
			toast({
				title: "Ошибка",
				description: error.message,
				variant: "destructive",
			});
		} else {
			toast({
				title: "Неизвестная ошибка",
				description: "Попробуйте позже",
				variant: "destructive",
			});
		}
	}
};

defineExpose({
	activateUsers,
	deleteUsers,
});
</script>

<style lang="scss" scoped></style>

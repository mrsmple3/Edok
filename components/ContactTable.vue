<template>
	<Table class="w-full">
		<TableHeader class="w-full table-header">
			<TableRow class="border-none">
				<TableHead class="t-head">
					<Checkbox :checked="isAllActive" class="checkbox-style" @update:checked="toggleAllCheckboxes" />
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
				<TableCell class="table-cell-checkbox">
					<Checkbox :checked="checkBoxUsers[index]?.id !== null" class="checkbox-style table-checkbox"
						@update:checked="updateCheckbox(index, invoice.id)" />
				</TableCell>
				<TableCell class="table-cell-name t-cell">{{ invoice.organization_name || invoice.name }}</TableCell>
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

defineExpose({
	activateUsers,
	deleteUsers,
});
</script>

<style lang="scss" scoped>
// Заголовок таблицы
.table-header {
	height: size(80px);
}

// Чекбоксы
.checkbox-style {
	background: #FFFFFF;
	border-color: #DBDBDB;
}

// Ячейка с чекбоксом
.table-cell-checkbox {
	padding-left: size(8px); // px-2 = 8px
	padding-right: size(8px); // px-2 = 8px
	width: size(20px); // w-5 = 20px
}

// Чекбокс в таблице
.table-checkbox {
	position: absolute;
	top: 50%;
	transform: translateY(-50%);
	z-index: 10;
}

// Ячейка с названием
.table-cell-name {
	width: size(300px);
	font-size: size(17px);
}
</style>

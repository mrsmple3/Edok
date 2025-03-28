<template>
	<Table class="w-full">
		<TableHeader class="w-full h-[80px]">
			<TableRow class="border-none">
				<TableHead class="t-head">
					<Checkbox :checked="isAllActive" class="bg-[#FFFFFF] border-[#DBDBDB]" @update:checked="toggleAllCheckboxes" />
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
			<TableRow v-for="(invoice, index) in tableData" :key="index" class="relative hover:bg-[#2d9cdb]/20">
				<TableCell class="px-2 w-5">
					<Checkbox :checked="checkBoxUsers[index]?.id !== null" class="bg-[#FFFFFF] border-[#DBDBDB]" @update:checked="updateCheckbox(index, invoice.id)" />
				</TableCell>
				<TableCell class="w-[300px] t-cell text-[17px]">{{ invoice.name }}</TableCell>
				<TableCell class="t-cell">{{ invoice.id }}</TableCell>
				<TableCell class="t-cell">{{ invoice.role }}</TableCell>
				<TableCell class="t-cell">{{ invoice.email ? invoice.email : "Не задано" }}</TableCell>
				<TableCell class="t-cell">{{ invoice.phone ? invoice.phone : "Не задано" }}</TableCell>
				<TableCell class="t-cell">{{ new Date(invoice.createdAt).toLocaleDateString("ru-RU") }}</TableCell>
				<ContactsDropDown :invoice="invoice"/>
			</TableRow>
		</TableBody>
	</Table>
</template>

<script lang="ts" setup>
	const props = defineProps({
		tableData: {
			type: Object,
			required: true,
		},
	});

	const isAllActive = ref(false);

	// Создаем массив checkBoxUsers с объектами { id: null }
	const checkBoxUsers = ref(
		props.tableData.map(() => ({
			id: null,
		}))
	);

	// Обновляем checkBoxUsers при изменении tableData
	watch(
		() => props.tableData,
		(newTableData) => {
			checkBoxUsers.value = newTableData.map(() => ({
				id: null,
			}));
		},
		{ immediate: true }
	);

	// Обновляем id в checkBoxUsers при изменении чекбокса
	const updateCheckbox = (index: number, id: any) => {
		checkBoxUsers.value[index].id = checkBoxUsers.value[index].id === null ? id : null;
	};

	// Переключение всех чекбоксов
	const toggleAllCheckboxes = () => {
		const newState = !isAllActive.value;
		isAllActive.value = newState;

		checkBoxUsers.value = props.tableData.map((item: any) => ({
			id: newState ? item.id : null,
		}));
	};
</script>

<style lang="scss" scoped></style>

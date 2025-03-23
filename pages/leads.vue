<template>
	<div class="page-container">
		<div class="w-full flex-center justify-between mb-[18px]">
			<div class="flex-center">
				<h2 class="page__title mr-[32px]">Угоди</h2>
				<button
					class="submenu-parent relative flex-center gap-[11px] rounded-[14px] border border-[#2d9cdb] py-2 px-7 text-[#2d9cdb] text-[18px] font-bold font-['Barlow'] mr-[24px] hover:active">
					<img alt="plus" class="w-[19px] h-[19px]" src="/icons/plus-blue.svg" />
					Добавить соглашение
					<div class="submenu">
						<LeadsDialogWindow v-if="userStore.isAuthInitialized" />
						<!-- <Dialog v-model:open="isDialogOpen">
							<DialogTrigger> Добавить спецификацию </DialogTrigger>
							<DialogContent>
								<DialogHeader>
									<DialogTitle>Добавить спецификацию</DialogTitle>
									<DialogDescription> Заполните поля сделки </DialogDescription>
								</DialogHeader>
								<div class="grid gap-4 py-4">
									<FormField name="name" v-slot="{ componentField }">
										<FormItem class="grid grid-cols-4 items-center gap-4">
											<FormControl>
												<Label for="name" class="text-[12px] text-start"> Название </Label>
												<div class="col-span-3 flex flex-col gap-2">
													<Input id="name" type="text" v-bind="componentField" />
													<FormMessage />
												</div>
											</FormControl>
										</FormItem>
									</FormField>
									<FormField name="type" v-slot="{ componentField }">
										<FormItem class="grid grid-cols-4 items-center gap-4">
											<FormControl>
												<Label for="type" class="text-[12px] text-start"> Тип </Label>
												<div class="col-span-3 flex flex-col gap-2">
													<Input id="type" type="text" v-bind="componentField" />
													<FormMessage />
												</div>
											</FormControl>
										</FormItem>
									</FormField>
									<FormField name="quantity" v-slot="{ componentField }">
										<FormItem class="grid grid-cols-4 items-center gap-4">
											<FormControl>
												<Label for="quantity" class="text-[12px] text-start"> Количество ст... </Label>
												<div class="col-span-3 flex flex-col gap-2">
													<Input id="quantity" class="" type="number" v-bind="componentField" />
													<FormMessage />
												</div>
											</FormControl>
										</FormItem>
									</FormField>
									<div class="grid grid-cols-4 items-center gap-4">
										<Label for="documents" class="text-[12px] text-start"> Документы </Label>
										<Input id="documents" type="file" accept="application/pdf" @change="handleFileChange" multiple class="col-span-3" />
									</div>
									<FormField v-slot="{ componentField }" name="moderator">
										<FormItem>
											<Select v-bind="componentField">
												<FormControl>
													<SelectTrigger>
														<SelectValue placeholder="Выберите модератора" />
													</SelectTrigger>
												</FormControl>
												<SelectContent>
													<SelectGroup>
														<SelectLabel>Модераторы</SelectLabel>
														<SelectItem v-for="moder in moderator" :value="moder.id"> {{ moder.name }} </SelectItem>
													</SelectGroup>
												</SelectContent>
											</Select>
											<FormMessage />
										</FormItem>
									</FormField>
								</div>
								<DialogFooter> <Button @click="createLead">Создать</Button> </DialogFooter>
							</DialogContent>
						</Dialog> -->
						<span>Добавить счет</span>
						<span>Добавить накладную</span>
						<span>Добавить подтверждающие документы</span>
					</div>
				</button>

				<div class="flex-center gap-6">
					<img alt="list" class="max-w-[24px] max-h-[24px] min-h-max min-w-max cursor-pointer" src="/icons/leads-icon-list-1.svg" />
					<img alt="list" class="max-w-[24px] max-h-[24px] min-h-max min-w-max cursor-pointer" src="/icons/leads-icon-list-2.svg" />
					<img alt="list" class="max-w-[24px] max-h-[24px] min-h-max min-w-max cursor-pointer" src="/icons/leads-icon-list-3.svg" />
					<img alt="list" class="max-w-[24px] max-h-[24px] min-h-max min-w-max cursor-pointer" src="/icons/leads-icon-list-4.svg" />
					<img alt="list" class="max-w-[24px] max-h-[24px] min-h-max min-w-max cursor-pointer" src="/icons/leads-icon-list-5.svg" />
				</div>
			</div>

			<div class="flex-center gap-[15px]">
				<Badge class="w-12 h-12 bg-[#2d9cdb]/20 rounded-[15px] hover:bg-[#2d9cdb]/30">
					<img alt="filter" src="/icons/filter.svg" />
				</Badge>
				<Badge class="w-12 h-12 bg-[#2d9cdb]/20 rounded-[15px] hover:bg-[#2d9cdb]/30">
					<img alt="filter" src="/icons/restar.svg" />
				</Badge>
			</div>
		</div>
		<div class="flex-center gap-[5px] mb-[26px]">
			<NuxtLink class="breadcrumbs" to="">Угоди</NuxtLink>
		</div>
		<div class="page__block pt-[40px] pb-[40px] px-[42px]">
			<LeadsFirstType v-if="!chatState" :invoices="counterpartyStore.leadsGetter" />
			<LeadsSecondType v-else :invoices="counterpartyStore.leadsGetter" />
		</div>
	</div>
</template>

<script lang="ts" setup>
	import { useForm } from "vee-validate";
	import { toTypedSchema } from "@vee-validate/zod";
	import * as z from "zod";
	import { useCounterpartyStore } from "~/store/counterparty.store";
	import { useUserStore } from "~/store/user.store";
	import { useToast } from "~/components/ui/toast";
	import type { Document } from "~/store/user.store";

	definePageMeta({
		layout: "page",
	});

	const chatState = useState("isChat");

	const route = useRoute();

	const counterpartyStore = useCounterpartyStore();
	const userStore = useUserStore();

	onBeforeMount(async () => {
		watch(
			() => [userStore.isAuthInitialized, route.fullPath],
			async ([newVal, route]) => {
				if (newVal) {
					await counterpartyStore.getLeadByUserId(userStore.userGetter.id);
				}
			}
		);
	});
</script>

<style lang="scss" scoped></style>

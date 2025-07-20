<template>
	<div class="w-full h-[100vh] flex items-center justify-center">
		<div class="form__container flex-col-center">
			<LoGo class="mb-[7px]" />
			<p class="text-center text-[#b9babd] text-xs font-normal mb-[57px]">Сервіс електронного документаобігу</p>
			<Tabs class="w-full" default-value="login">
				<TabsList class="w-full flex items-center justify-between mb-[38px]">
					<TabsTrigger
						class="!w-max data-[state=active]:!bg-[#00b074]/20 rounded-lg !text-center !text-[#464154] data-[state=active]:!text-[#00b074] !text-lg !font-bold py-[15px] px-[30px]"
						value="login">
						Вхід за реквізитами
					</TabsTrigger>
					<TabsTrigger
						class="!w-max data-[state=active]:!bg-[#00b074]/20 rounded-lg !text-center !text-[#464154] data-[state=active]:!text-[#00b074] !text-lg !font-bold py-[15px] px-[30px]"
						value="register">
						Реєстрація
					</TabsTrigger>
				</TabsList>
				<TabsContent value="login">
					<LoginComponent />
				</TabsContent>
				<TabsContent value="register">
					<RegisterComponent />
				</TabsContent>
			</Tabs>
		</div>
	</div>
</template>

<script lang="ts" setup></script>

<style lang="scss">
.form__container {
	width: size(490px);
}

.form__input {
	width: 100%;
	color: #969ba0;
	height: max-content;
	font-size: 1rem;
	font-weight: normal;
	padding: 18px 28px;
	border-radius: 10px;
}

.form__submit-btn {
	width: size(179px);
	height: size(54px);
	background: #00b074;
	border-radius: 8px;
	text-align: center;
	color: white;
	font-size: 18px;
	font-family: "Barlow", sans-serif;
	font-weight: 700;
	word-wrap: break-word;
	margin: 0 auto;
}
</style>

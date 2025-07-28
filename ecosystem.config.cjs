module.exports = {
	apps: [
		{
			name: "NuxtApp",
			script: "./.output/server/index.mjs",
			exec_mode: "fork",
			watch: false,
			env: {
				NODE_ENV: "production",
				DATABASE_URL: "mysql://agroedoc_com:ExApY0eBcnGKJkCd@185.69.155.118:3306/agroedoc_com",
				PORT: "3001", // Основное приложение на порту 3001
			},
		},
		{
			name: "NuxtSocketApp",
			script: "./server/entry.js", // Изменено на .js
			exec_mode: "fork",
			watch: false,
			env: {
				NODE_ENV: "production",
				DATABASE_URL: "mysql://agroedoc_com:ExApY0eBcnGKJkCd@185.69.155.118:3306/agroedoc_com",
				PORT: "3000", // Socket.IO сервер на порту 3000
			},
		},
	],
};

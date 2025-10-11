# PageLoader - Документация

## Описание

`PageLoader` - это универсальный компонент загрузчика для приложения Nuxt, который отображается поверх всей страницы во время загрузки данных.

## Структура файлов

```
components/
  └── PageLoader.vue           # Визуальный компонент загрузчика

composables/
  └── usePageLoader.ts         # Composable для управления состоянием

app.vue                        # Глобальное подключение компонента
```

## Использование

### 1. Базовое использование

```vue
<script setup lang="ts">
	const { withLoader } = usePageLoader();

	// Обернуть асинхронную операцию в withLoader
	const loadData = async () => {
		await withLoader(async () => {
			await fetchSomeData();
		});
	};
</script>
```

### 2. Ручное управление

```vue
<script setup lang="ts">
	const { showLoader, hideLoader } = usePageLoader();

	const customLoad = async () => {
		showLoader(); // Показать loader
		try {
			await fetchData();
		} finally {
			hideLoader(); // Скрыть loader
		}
	};
</script>
```

### 3. Использование в watch

```vue
<script setup lang="ts">
	const { withLoader } = usePageLoader();

	watch(
		() => [userStore.isAuthInitialized, route.fullPath],
		async ([newVal]) => {
			if (newVal) {
				await withLoader(async () => {
					await loadPageData();
				});
			}
		},
		{ immediate: true }
	);
</script>
```

## API

### usePageLoader()

Composable, который предоставляет методы для управления загрузчиком.

**Возвращаемые значения:**

- `isLoading` (Ref<boolean>) - реактивное состояние загрузки
- `showLoader()` - показать загрузчик
- `hideLoader()` - скрыть загрузчик
- `withLoader(fn)` - автоматически управляет показом/скрытием загрузчика для асинхронной функции

**Пример:**

```typescript
const { isLoading, showLoader, hideLoader, withLoader } = usePageLoader();

// Проверить состояние
console.log(isLoading.value); // true/false

// Использовать автоматическое управление
await withLoader(async () => {
	await someAsyncOperation();
});
```

## Стилизация

Компонент использует следующие стили:

- **Позиция**: fixed, покрывает весь экран (100vw x 100vh)
- **z-index**: 9999 (выше всех элементов)
- **Фон**: полупрозрачный белый с эффектом blur
- **Анимация**: плавное появление/исчезновение (fade transition)
- **Spinner**: вращающийся круг с цветом бренда (#2d9cdb)

## Где используется

Loader автоматически интегрирован на следующих страницах:

- `/pages/index.vue` - главная страница (мои задачи)
- `/pages/contacts.vue` - страница контактов
- `/pages/docs.vue` - страница документов
- `/pages/archive.vue` - архив документов
- `/pages/leads/index.vue` - список лидов
- `/pages/leads/docs.vue` - документы лида
- `/pages/user/docs.vue` - документы пользователя
- `/pages/user/leads.vue` - лиды пользователя

## Преимущества

1. **Универсальность** - один компонент для всего приложения
2. **Простота использования** - обертка `withLoader()` автоматически управляет состоянием
3. **Глобальное состояние** - использует useState для синхронизации между компонентами
4. **Автоматическое скрытие** - даже при ошибке загрузчик скроется благодаря finally
5. **Красивая анимация** - плавные переходы для улучшения UX

## Примечания

- Загрузчик отображается только когда `isLoading.value === true`
- Использует глобальное состояние `useState('pageLoading')` для синхронизации
- Компонент автоматически подключен в `app.vue` и доступен на всех страницах
- Ошибки TypeScript в редакторе для `useState` и `usePageLoader` - это нормально, они исчезнут после сборки/перезапуска

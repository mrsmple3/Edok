# SearchableSelect Component

Компонент для поиска и выбора пользователей с функцией фильтрации.

## Расположение

`/components/custom/SearchableSelect.vue`

## Возможности

- ✅ Поиск пользователей по имени, email, номеру телефона и названию организации
- ✅ Выпадающий список с результатами поиска
- ✅ Навигация с клавиатуры (стрелки вверх/вниз, Enter, Escape)
- ✅ Интеграция с vee-validate формами
- ✅ Поддержка различных полей для отображения
- ✅ Адаптивный дизайн

## Использование

### Базовое использование

```vue
<SearchableSelect v-model="selectedUserId" :users="userList" placeholder="Выберите пользователя..." />
```

### В форме с валидацией

```vue
<FormField v-slot="{ componentField }" name="moderator">
  <FormItem>
    <FormLabel>Модератор</FormLabel>
    <FormControl>
      <SearchableSelect
        v-bind="componentField"
        :users="moderators"
        placeholder="Оберіть модератора"
        display-field="name"
      />
    </FormControl>
    <FormMessage />
  </FormItem>
</FormField>
```

## Пропсы

| Пропс          | Тип                        | По умолчанию               | Описание                                                   |
| -------------- | -------------------------- | -------------------------- | ---------------------------------------------------------- |
| `users`        | `User[]`                   | `[]`                       | Массив пользователей для выбора                            |
| `placeholder`  | `string`                   | `"Оберіть користувача..."` | Текст подсказки                                            |
| `modelValue`   | `number \| string \| null` | `null`                     | Выбранное значение (ID пользователя)                       |
| `displayField` | `string`                   | `"auto"`                   | Поле для отображения (`"auto"`, `"name"`, `"email"`, etc.) |

## События

| Событие             | Тип                                         | Описание                                   |
| ------------------- | ------------------------------------------- | ------------------------------------------ |
| `update:modelValue` | `(value: number \| string \| null) => void` | Эмитится при изменении выбранного значения |

## Интерфейс User

```typescript
interface User {
	id?: number | null;
	email?: string;
	phone?: string;
	name?: string;
	organization_name?: string;
	[key: string]: any;
}
```

## Логика отображения

При `display-field="auto"` компонент выбирает первое доступное поле в порядке:

1. `name`
2. `organization_name`
3. `email`
4. `phone`
5. `"User {id}"`

## Навигация с клавиатуры

- `↑` / `↓` - навигация по списку
- `Enter` - выбор выделенного элемента
- `Escape` - закрытие списка
- `Focus/Blur` - открытие/закрытие списка

## Стилизация

Компонент использует Tailwind CSS классы и совместим с дизайн-системой проекта. Основные стили:

- Поле ввода с иконкой стрелки
- Выпадающий список с тенью и границами
- Выделение при наведении и выборе
- Галочка для выбранного элемента

## Примеры использования в проекте

### DialogWindow.vue (создание договоров)

```vue
<SearchableSelect :users="userStore.moderatorsGetter" placeholder="Оберіть модератора..." display-field="name" v-bind="componentField" />
```

### Тестирование

Для тестирования компонента создана страница `/test-search` с примерами использования.

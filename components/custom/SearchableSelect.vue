<template>
  <div class="user-search-select relative">
    <div class="relative">
      <!-- Поле поиска -->
      <Input
        v-model="searchTerm"
        :placeholder="selectedUser ? displayName(selectedUser) : placeholder"
        @focus="isOpen = true"
        @blur="handleBlur"
        @keydown.escape="isOpen = false"
        @keydown.enter.prevent="selectHighlightedUser"
        @keydown.up.prevent="highlightPreviousUser"
        @keydown.down.prevent="highlightNextUser"
        class="pr-8"
      />
      
      <!-- Иконка стрелки -->
      <button
        type="button"
        @click="toggleDropdown"
        class="absolute right-2 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600"
      >
        <ChevronDown class="h-4 w-4" />
      </button>
    </div>

    <!-- Выпадающий список -->
    <div 
      v-if="isOpen"
      class="absolute top-full left-0 right-0 z-50 mt-1 bg-white border border-stone-200 rounded-md shadow-lg max-h-60 overflow-auto"
    >
      <div v-if="filteredUsers.length === 0" class="py-6 text-center text-sm text-stone-500">
        Нічого не знайдено
      </div>
      
      <div
        v-for="(user, index) in filteredUsers"
        :key="user.id || `user-${index}`"
        @mousedown.prevent="selectUser(user)"
        @mouseenter="highlightedIndex = index"
        :class="{
          'bg-stone-100': highlightedIndex === index,
          'bg-blue-50': selectedValue === user.id
        }"
        class="relative flex cursor-pointer select-none items-center px-3 py-2 text-sm hover:bg-stone-50"
      >
        <Check 
          v-if="selectedValue === user.id"
          class="mr-2 h-4 w-4 text-blue-600"
        />
        <span class="ml-6" v-else></span>
        {{ displayName(user) }}
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch, nextTick } from 'vue';
import { Check, ChevronDown } from 'lucide-vue-next';

// Определяем интерфейс User локально, чтобы избежать проблем с импортами
interface User {
  id?: number | null;
  email?: string;
  phone?: string;
  name?: string;
  organization_name?: string;
  [key: string]: any;
}

interface Props {
  users: User[];
  placeholder?: string;
  modelValue?: number | string | null;
  displayField?: string; // Какое поле показывать для отображения
}

const props = withDefaults(defineProps<Props>(), {
  placeholder: 'Оберіть користувача...',
  displayField: 'auto'
});

const emit = defineEmits<{
  'update:modelValue': [value: number | string | null];
}>();

const selectedValue = ref<number | string | null>(props.modelValue || null);
const searchTerm = ref('');
const isOpen = ref(false);
const highlightedIndex = ref(-1);

// Найти выбранного пользователя
const selectedUser = computed(() => {
  if (!selectedValue.value) return null;
  return props.users.find(user => user.id === selectedValue.value) || null;
});

// Синхронизируем с родительским компонентом
watch(selectedValue, (newValue) => {
  emit('update:modelValue', newValue);
});

watch(() => props.modelValue, (newValue) => {
  if (newValue !== undefined) {
    selectedValue.value = newValue;
  }
});

// Функция для получения отображаемого имени
const displayName = (user: User): string => {
  if (props.displayField === 'auto') {
    return user.name || user.organization_name || user.email || user.phone || `User ${user.id}`;
  }
  return user[props.displayField] || `User ${user.id}`;
};

// Фильтрация пользователей по поисковому запросу
const filteredUsers = computed(() => {
  if (!searchTerm.value.trim()) {
    return props.users;
  }

  const term = searchTerm.value.toLowerCase();
  return props.users.filter(user => {
    const searchableFields = [
      user.name,
      user.organization_name,
      user.email,
      user.phone
    ].filter(Boolean);

    return searchableFields.some(field => 
      field?.toLowerCase().includes(term)
    );
  });
});

// Методы управления
const toggleDropdown = () => {
  isOpen.value = !isOpen.value;
  if (isOpen.value) {
    highlightedIndex.value = -1;
    searchTerm.value = '';
  }
};

const selectUser = (user: User) => {
  selectedValue.value = user.id || null;
  searchTerm.value = '';
  isOpen.value = false;
  highlightedIndex.value = -1;
};

const handleBlur = () => {
  // Задержка для обработки клика по элементу списка
  setTimeout(() => {
    isOpen.value = false;
    if (selectedUser.value) {
      searchTerm.value = '';
    }
  }, 150);
};

// Навигация с клавиатуры
const highlightNextUser = () => {
  if (highlightedIndex.value < filteredUsers.value.length - 1) {
    highlightedIndex.value++;
  }
};

const highlightPreviousUser = () => {
  if (highlightedIndex.value > 0) {
    highlightedIndex.value--;
  }
};

const selectHighlightedUser = () => {
  if (highlightedIndex.value >= 0 && filteredUsers.value[highlightedIndex.value]) {
    selectUser(filteredUsers.value[highlightedIndex.value]);
  }
};

// Сбросить поиск при открытии
watch(isOpen, (newVal) => {
  if (newVal) {
    searchTerm.value = '';
    highlightedIndex.value = -1;
  }
});
</script>

<style scoped>
.user-search-select {
  position: relative;
}
</style>
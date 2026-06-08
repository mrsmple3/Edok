import type { ComputedRef, Ref } from "vue";

export interface UsePagedListOptions<T> {
	pageSize: number;
	sort?: (a: T, b: T) => number;
	filter?: (item: T) => boolean;
}

export interface UsePagedListResult<T> {
	currentPage: Ref<number>;
	itemsPerPage: ComputedRef<number>;
	totalItems: ComputedRef<number>;
	processed: ComputedRef<T[]>;
	paginated: ComputedRef<T[]>;
	onPageChange: (newPage: number) => Promise<void>;
	resetPage: () => Promise<void>;
}

const parsePageQuery = (value: unknown): number => {
	const raw = Array.isArray(value) ? value[0] : value;
	const parsed = Number(raw);
	return Number.isInteger(parsed) && parsed > 0 ? parsed : 1;
};

/**
 * Унифицированная пагинация для табличных страниц.
 * - URL-sync через ?page=N (страница 1 → query очищается).
 * - sort/filter применяются к source перед слайсом.
 * - При смене фильтра currentPage не сбрасывается автоматически — вызывайте resetPage()
 *   из watch'а на свой searchQuery/фильтр.
 */
export function usePagedList<T>(
	source: Ref<T[]> | ComputedRef<T[]>,
	options: UsePagedListOptions<T>,
): UsePagedListResult<T> {
	const route = useRoute();
	const router = useRouter();

	const currentPage = ref(parsePageQuery(route.query.page));
	const itemsPerPage = computed(() => options.pageSize);

	watch(
		() => route.query.page,
		(value) => {
			currentPage.value = parsePageQuery(value);
		},
	);

	const processed = computed<T[]>(() => {
		let list = source.value;
		if (options.filter) list = list.filter(options.filter);
		if (options.sort) list = [...list].sort(options.sort);
		return list;
	});

	const totalItems = computed(() => processed.value.length);
	const totalPages = computed(() =>
		Math.max(1, Math.ceil(totalItems.value / itemsPerPage.value)),
	);

	const paginated = computed<T[]>(() => {
		const start = (currentPage.value - 1) * itemsPerPage.value;
		return processed.value.slice(start, start + itemsPerPage.value);
	});

	const onPageChange = async (newPage: number) => {
		currentPage.value = newPage;
		const query = { ...route.query };
		if (newPage <= 1) {
			delete query.page;
		} else {
			query.page = String(newPage);
		}
		await router.replace({ query });
	};

	const resetPage = async () => {
		if (currentPage.value !== 1) await onPageChange(1);
	};

	watch(totalPages, async (max) => {
		if (currentPage.value > max) await onPageChange(max);
	}, { immediate: true });

	return {
		currentPage,
		itemsPerPage,
		totalItems,
		processed,
		paginated,
		onPageChange,
		resetPage,
	};
}

export const byCreatedAtDesc = <T extends { createdAt: string | Date }>(
	a: T,
	b: T,
): number => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();

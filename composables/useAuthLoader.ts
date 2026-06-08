import type { WatchSource } from "vue";
import { useUserStore } from "~/store/user.store";

/**
 * Хук для страниц, которым нужно подгружать данные после инициализации auth.
 *
 * Заменяет повторяющийся паттерн вида:
 * ```ts
 * onBeforeMount(() => {
 *   watch(
 *     () => [userStore.isAuthInitialized, route.path, route.query.xxx],
 *     async ([initialized]) => {
 *       if (initialized) {
 *         await withLoader(async () => { ... });
 *       }
 *     },
 *     { immediate: true },
 *   );
 * });
 * ```
 *
 * Использование:
 * ```ts
 * useAuthLoader(async () => {
 *   await adminStore.getAllUnsignedDocuments();
 * });
 *
 * // С реактивными зависимостями (loader перезапускается при их смене):
 * useAuthLoader(
 *   async () => await adminStore.getUserByRole(selectedRole.value),
 *   () => [selectedRole.value],
 * );
 * ```
 *
 * Loader НЕ запустится, пока `userStore.isAuthInitialized` не станет true.
 * `withLoader` оборачивает каждый вызов (глобальный page loader).
 */
export function useAuthLoader(
	loader: () => Promise<void> | void,
	deps?: WatchSource<unknown> | WatchSource<unknown>[],
): void {
	const userStore = useUserStore();
	const route = useRoute();
	const { withLoader } = usePageLoader();

	const source = (): unknown[] => {
		const auth = [userStore.isAuthInitialized, route.path];
		if (!deps) return auth;
		const depsArray = Array.isArray(deps) ? deps : [deps];
		const depValues = depsArray.map((d) => (typeof d === "function" ? d() : d.value));
		return [...auth, ...depValues];
	};

	onBeforeMount(() => {
		watch(
			source,
			async ([isAuthInitialized]) => {
				if (!isAuthInitialized) return;
				await withLoader(async () => {
					await loader();
				});
			},
			{ immediate: true },
		);
	});
}

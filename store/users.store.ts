import type { User } from "@prisma/client";
import { useAdminStore } from "~/store/admin.store";
import type { CreateUserPayload, UpdateUserPayload } from "~/store/user.store";

/**
 * Domain store для пользователей-сущностей (управляемых админом: контакты, контрагенты, модераторы и т.п.).
 *
 * **НЕ путать с [[useUserStore]]** — тот про текущего залогиненного юзера (auth/session).
 *
 * Текущая реализация — фасад поверх [[useAdminStore]]. См. JSDoc в [[useDocumentsStore]].
 */
export const useUsersStore = defineStore("users", () => {
	const admin = useAdminStore();

	// ─── State (read-only computed proxies) ─────────────────────────────────

	const users = computed<User[]>(() => admin.users);

	// ─── Getters ────────────────────────────────────────────────────────────

	const getUserById = (id: number): User | undefined => admin.getterUserById(id);

	// ─── Actions (delegated to admin.store) ─────────────────────────────────

	const getUserByRole = (role: string) => admin.getUserByRole(role);
	const createUser = (payload: CreateUserPayload) => admin.createUser(payload);
	const updateUser = (payload: UpdateUserPayload) => admin.updateUser(payload);
	const patchUser = (payload: UpdateUserPayload) => admin.patchUser(payload);
	const deleteUser = (id: number) => admin.deleteUser(id);

	return {
		users,
		getUserById,
		getUserByRole,
		createUser,
		updateUser,
		patchUser,
		deleteUser,
	};
});

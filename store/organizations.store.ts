import { useAdminStore } from "~/store/admin.store";
import type { Organization } from "~/store/user.store";

/**
 * Domain store для организаций.
 *
 * Текущая реализация — фасад поверх [[useAdminStore]]. См. JSDoc в [[useDocumentsStore]].
 */
export const useOrganizationsStore = defineStore("organizations", () => {
	const admin = useAdminStore();

	// ─── State (read-only computed proxies) ─────────────────────────────────

	const organizations = computed<Organization[]>(() => admin.organizations);

	// ─── Actions (delegated to admin.store) ─────────────────────────────────

	const getOrganizations = () => admin.getOrganizations();
	const createOrganization = (data: { name: string; inn?: string | null }) =>
		admin.createOrganization(data);
	const deleteOrganization = (id: number) => admin.deleteOrganization(id);

	return {
		organizations,
		getOrganizations,
		createOrganization,
		deleteOrganization,
	};
});

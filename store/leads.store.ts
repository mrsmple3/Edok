import { useAdminStore } from "~/store/admin.store";
import type { CreateLeadPayload, Lead, UpdateLeadPayload } from "~/store/user.store";

/**
 * Domain store для угод (leads).
 *
 * **Текущая реализация** — фасад поверх [[useAdminStore]] для гарантии single source of truth.
 * См. JSDoc в [[useDocumentsStore]] для деталей миграционной стратегии.
 */
export const useLeadsStore = defineStore("leads", () => {
	const admin = useAdminStore();

	// ─── State (read-only computed proxies) ─────────────────────────────────

	const leads = computed<Lead[]>(() => admin.leads);
	const filteredLeads = computed<Lead[]>(() => admin.filteredLeads);

	// ─── Actions (delegated to admin.store) ─────────────────────────────────

	const createLead = (payload: CreateLeadPayload) => admin.createLead(payload);
	const updateLead = (payload: UpdateLeadPayload) => admin.updateLead(payload);
	const deleteLead = (id: number) => admin.deleteLead(id);
	const getLeads = () => admin.getLeads();
	const getLeadById = (id: number) => admin.getLeadById(id);
	const getLeadByUserId = (userId: number | string | undefined) =>
		admin.getLeadByUserId(userId);

	return {
		leads,
		filteredLeads,
		createLead,
		updateLead,
		deleteLead,
		getLeads,
		getLeadById,
		getLeadByUserId,
	};
});

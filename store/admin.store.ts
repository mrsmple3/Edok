import { useFetchApi } from "~/utils/api";
import { handleApiError } from "~/utils/errorHandler";
import type { Lead, Document } from "~/store/user.store"; // Предположим, что у вас есть тип Lead

const defaultValue: {
	leads: Lead[];
	documents: Document[];
} = {
	leads: [],
	documents: [],
};

export const useAdminStore = defineStore("admin", {
	state: () => defaultValue,
	getters: {
		leadsGetter: (state): Lead[] => state.leads,
		documentsGetter: (state): Document[] => state.documents,
	},
	actions: {
		async createLead(lead: any) {
			try {
				const response: any = await useFetchApi("/api/admin/lead", {
					method: "POST",
					body: lead,
				});
				this.$patch({ leads: [...this.leadsGetter, response.body.lead] });
				return response.body.lead;
			} catch (error) {
				handleApiError(error);
			}
		},
		async getLeadById(id: number) {
			try {
				const response: any = await useFetchApi(`/api/admin/lead/${id}`);
				return response.body.lead;
			} catch (error) {
				handleApiError(error);
			}
		},
		async updateLead(lead: any) {
			try {
				const response: any = await useFetchApi(`/api/admin/lead/${lead.id}`, {
					method: "PUT",
					body: lead,
				});
				this.$patch({ leads: this.leadsGetter.map((l) => (l.id === lead.id ? response.body.lead : l)) });
				return response.body.lead;
			} catch (error) {
				handleApiError(error);
			}
		},
		async deleteLead(id: number) {
			try {
				const response: any = await useFetchApi(`/api/admin/lead/${id}`, {
					method: "DELETE",
				});
				this.$patch({ leads: this.leadsGetter.filter((l) => l.id !== id) });
				return response.body.lead;
			} catch (error) {
				handleApiError(error);
			}
		},
		async getLeads() {
			try {
				const response: any = await useFetchApi("/api/admin/lead");
				return response.body.leads;
			} catch (error) {
				handleApiError(error);
			}
		},
		async createDocument(document: any, file: File) {
			try {
				const formData = new FormData();
				formData.append("title", document.title);
				formData.append("userId", document.userId);
				formData.append("counterpartyId", document.userId);
				formData.append("file", file);
				formData.append("type", document.type);
				formData.append("status", document.status);

				const response: any = await useFetchApi("/api/counterparty/document", {
					method: "POST",
					body: formData,
				});

				return response.body.document;
			} catch (error) {
				handleApiError(error);
			}
		},
		async updateDocument(document: any) {
			try {
				const response: any = await useFetchApi(`/api/admin/document/${document.id}`, {
					method: "PUT",
					body: document,
				});
				this.$patch({ documents: this.documentsGetter.map((d) => (d.id === document.id ? response.body.document : d)) });
				return response.body.document;
			} catch (error) {
				handleApiError(error);
			}
		},
		async deleteDocument(id: number) {
			try {
				const response: any = await useFetchApi(`/api/admin/document/${id}`, {
					method: "DELETE",
				});
				this.$patch({ documents: this.documentsGetter.filter((d) => d.id !== id) });
				return response.body.document;
			} catch (error) {
				handleApiError(error);
			}
		},
		async getDocumentsByUserId(userId: number) {
			try {
				const response: any = await useFetchApi(`/api/counterparty/document/user/${userId}`);
				return response.body.documents;
			} catch (error) {
				handleApiError(error);
			}
		},
		async getDocumentsByLeadId(leadId: any) {
			try {
				const response: any = await useFetchApi(`/api/counterparty/document/lead/${leadId}`);
				this.$patch({ documents: response.body.documents });
				return response.body.documents;
			} catch (error) {
				handleApiError(error);
			}
		},
		async getLeadByUserId(userId: number | null | undefined) {
			try {
				if (!userId) {
					throw new Error("Необходимо указать userId");
				}
				const response: any = await useFetchApi(`/api/counterparty/lead/user/${userId}`);
				this.$patch({ leads: response.body.leads });
				return response.body.lead;
			} catch (error) {
				handleApiError(error);
			}
		},
	},
});

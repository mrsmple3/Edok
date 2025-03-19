import { useFetchApi } from "~/utils/api";
import { handleApiError } from "~/utils/errorHandler";
import type { Document, Lead, LeadsResponse } from "./user.store";

const defaultValue: {
	leads: Lead[];
	documents: Document[];
} = {
	leads: [],
	documents: [],
};

export const useCounterpartyStore = defineStore("counterparty", {
	state: () => defaultValue,
	getters: {
		leadsGetter: (state): Lead[] => state.leads,
		documentsGetter: (state): Document[] => state.documents,
	},
	actions: {
		async createDocument(document: any, file: File) {
			try {
				const formData = new FormData();
				formData.append("title", document.title);
				formData.append("userId", document.userId);
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
		async createLead(lead: any) {
			try {
				const response: any = await useFetchApi("/api/counterparty/lead", {
					method: "POST",
					body: lead,
				});
				return response.body.lead;
			} catch (error) {}
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

import { useFetchApi } from "~/utils/api";
import { handleApiError } from "~/utils/errorHandler";
import type {
	CreateDocumentPayload,
	CreateLeadPayload,
	Document,
	DocumentResponse,
	DocumentsResponse,
	Lead,
	LeadResponse,
	LeadsResponse,
} from "./user.store";

interface CounterpartyState {
	leads: Lead[];
	documents: Document[];
}

const defaultValue: CounterpartyState = {
	leads: [],
	documents: [],
};

export const useCounterpartyStore = defineStore("counterparty", {
	state: (): CounterpartyState => defaultValue,
	getters: {
		leadsGetter: (state): Lead[] => state.leads,
		documentsGetter: (state): Document[] => state.documents,
	},
	actions: {
		async createDocument(document: CreateDocumentPayload, file: File): Promise<Document | undefined> {
			try {
				const formData = new FormData();
				formData.append("title", document.title);
				formData.append("userId", String(document.userId));
				formData.append("file", file);
				formData.append("type", document.type);
				formData.append("status", document.status);
				if (document.counterpartyId != null) formData.append("counterpartyId", String(document.counterpartyId));
				formData.append("content", "Для информации Подтверждающие");

				const response = await useFetchApi("/api/counterparty/document", {
					method: "POST",
					body: formData,
				}) as DocumentResponse;
				return response.body.document;
			} catch (error) {
				handleApiError(error);
			}
		},

		async getDocumentsByUserId(userId: number): Promise<Document[] | undefined> {
			try {
				const response = await useFetchApi(`/api/counterparty/document/user/${userId}`) as DocumentsResponse;
				return response.body.documents;
			} catch (error) {
				handleApiError(error);
			}
		},

		async getDocumentsByLeadId(leadId: number | string): Promise<Document[] | undefined> {
			try {
				const response = await useFetchApi(`/api/counterparty/document/lead/${leadId}`) as DocumentsResponse;
				this.$patch({ documents: response.body.documents });
				return response.body.documents;
			} catch (error) {
				handleApiError(error);
			}
		},

		async getLeadByUserId(userId: number | null | undefined): Promise<Lead[] | undefined> {
			try {
				if (!userId) {
					throw new Error("Необхідно вказати userId");
				}
				const response = await useFetchApi(`/api/counterparty/lead/user/${userId}`) as LeadsResponse;
				this.$patch({ leads: response.body.leads });
				return response.body.leads;
			} catch (error) {
				handleApiError(error);
			}
		},

		async createLead(lead: CreateLeadPayload): Promise<Lead | undefined> {
			try {
				const response = await useFetchApi("/api/counterparty/lead", {
					method: "POST",
					body: lead,
				}) as LeadResponse;
				this.$patch({ leads: [...this.leads, response.body.lead] });
				return response.body.lead;
			} catch (error) {
				handleApiError(error);
			}
		},
	},
});

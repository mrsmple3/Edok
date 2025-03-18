import { useFetchApi } from "~/utils/api";
import { handleApiError } from "~/utils/errorHandler";

const defaultValue: {} = {};

export const useCounterpartyStore = defineStore("counterparty", {
	state: () => defaultValue,
	getters: {},
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
		async createLead(lead: any) {
			try {
				const response: any = await useFetchApi("/api/counterparty/lead", {
					method: "POST",
					body: lead,
				});
				return response.body.lead;
			} catch (error) {}
		},
	},
});

import { useFetchApi } from "~/utils/api";
import { handleApiError } from "~/utils/errorHandler";
import type { Lead, Document, UserResponse } from "~/store/user.store"; // Предположим, что у вас есть тип Lead
import type { User } from "@prisma/client";
import { updateUser } from "~/server/db/users";

const defaultValue: {
	leads: Lead[];
	documents: Document[];
	users: User[];
	filteredDocuments: Document[];
	filteredLeads: Lead[];
	unsignedDocuments: Document[];
	signedDocuments: Document[];
} = {
	leads: [],
	documents: [],
	users: [],
	filteredDocuments: [],
	filteredLeads: [],
	unsignedDocuments: [],
	signedDocuments: [],
};

export const useAdminStore = defineStore("admin", {
	state: () => defaultValue,
	getters: {
		leadsGetter: (state): Lead[] => state.leads,
		documentsGetter: (state): Document[] => state.documents,
		getDocumentById: (state) => {
			return (id: number) => {
				if (state.unsignedDocuments.length !== 0) {
					return state.unsignedDocuments.find((document) => document.id === id);
				} else {
					return state.documents.find((document) => document.id === id);
				}
			};
		},
		insignedDocumentsGetter: (state): Document[] => state.unsignedDocuments,
		getterUserById: (state) => {
			return (id: number) => {
				return state.users.find((user) => user.id === id);
			};
		},
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
				this.$patch({ leads: response.body.leads });
				return response.body.leads;
			} catch (error) {
				handleApiError(error);
			}
		},
		async getLeadByUserId(userId: any) {
			try {
				if (!userId) {
					throw new Error("Необходимо указать userId");
				}
				const response: any = await useFetchApi(`/api/admin/lead/user/${userId}`);
				this.$patch({ leads: response.body.leads });
				return response.body.lead;
			} catch (error) {
				handleApiError(error);
			}
		},
		async createDocument(document: any, file: File) {
			try {
				const formData = new FormData();
				formData.append("title", document.title);
				formData.append("userId", document.userId);
				formData.append("counterpartyId", document.counterpartyId);
				formData.append("file", file);
				formData.append("type", document.type);
				formData.append("leadId", document.leadId);
				formData.append("moderatorId", document.moderatorId);
				formData.append("status", document.status);

				const response: any = await useFetchApi("/api/admin/document", {
					method: "POST",
					body: formData,
				});

				this.$patch({ documents: [...this.documentsGetter, response.body.document] });

				return response.body.document;
			} catch (error) {
				handleApiError(error);
			}
		},
		async getAllDocuments() {
			try {
				const response: any = await useFetchApi("/api/admin/document");
				this.$patch({ documents: response.body.documents });
				return response.body.documents;
			} catch (error) {
				handleApiError(error);
			}
		},
		async getAllUnsignedDocuments() {
			try {
				const response: any = await useFetchApi("/api/admin/document/unsigned");
				this.$patch({ unsignedDocuments: response.body.documents });
				return response.body.documents;
			} catch (error) {
				handleApiError(error);
			}
		},
		async getUnsignedDocumentsByUserId(userId: number) {
			try {
				const response: Document[] = await useFetchApi(`/api/admin/document/unsigned/${userId}`);
				this.$patch({ unsignedDocuments: response.body.documents });
				return response.body.documents;
			} catch (error) {
				handleApiError(error);
			}
		},
		async getAllSignedDocuments() {
			try {
				const response: Document[] = await useFetchApi("/api/admin/document/archive");
				this.$patch({ signedDocuments: response.body.documents });
				return response.body.documents;
			} catch (error) {
				handleApiError(error);
			}
		},
		async getSignedDocumentsByUserId(userId: number) {
			try {
				const response: Document[] = await useFetchApi(`/api/admin/document/archive/${userId}`);
				this.$patch({ signedDocuments: response.body.documents });
				return response.body.documents;
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
		async updateDocumentModerator(id: number, moderatorId: number) {
			try {
				const response: any = await useFetchApi(`/api/admin/document/moder/${id}`, {
					method: "PATCH",
					body: { moderatorId },
				});
				this.$patch({ documents: this.documentsGetter.map((d) => (d.id === id ? { ...d, moderatorId } : d)) });
				return response.body.document;
			} catch (error) {
				handleApiError(error);
			}
		},
		async deleteDocument(userId: any, id: number) {
			try {
				const response: any = await useFetchApi(`/api/admin/document/delete`, {
					method: "POST",
					body: { userId, documentId: id },
				});
				if (response.body.message === 'Видалення підтверджено. Очікується підтвердження другого користувача.')
					this.$patch({ documents: this.documentsGetter.map((d) => (d.id === id ? { ...d, deleteSignCount: d.deleteSignCount + 1 } : d)) });
				else
					this.$patch({ documents: this.documentsGetter.filter((d) => d.id !== id) });

				return response.body.error || response.body.message;
			} catch (error) {
				handleApiError(error);
			}
		},
		async createSign(documentId: number, userId: number, signature: File, finalPdfFile: File, certInfo?: any, stampData: any) {
			try {
				console.log("📤 Отправляем данные на сервер:", {
					documentId,
					userId,
					signatureSize: signature.size,
					signatureName: signature.name,
					finalPdfFileSize: finalPdfFile.size,
					finalPdfFileName: finalPdfFile.name,
					certInfo: certInfo ? 'есть' : 'отсутствует',
					stampData: stampData ? 'есть' : 'отсутствует'
				});

				// Валидация перед отправкой
				if (!signature || signature.size === 0) {
					throw new Error('Файл подписи пустой или отсутствует');
				}

				if (!finalPdfFile || finalPdfFile.size === 0) {
					throw new Error('PDF файл пустой или отсутствует');
				}

				const formData = new FormData();
				formData.append("documentId", documentId.toString());
				formData.append("userId", userId.toString());
				formData.append("signature", signature);
				formData.append("finalPdfFile", finalPdfFile);
				formData.append('certInfo', JSON.stringify(certInfo));
				formData.append('stampData', JSON.stringify(stampData));

				console.log("📤 FormData готов к отправке");

				const response: any = await useFetchApi("/api/sign", {
					method: "POST",
					body: formData,
				});

				console.log("✅ Ответ от сервера:", response);
				return response.body.sign;
			} catch (error) {
				console.error("❌ Ошибка в createSign:", error);
				handleApiError(error);
				throw error; // Пробрасываем ошибку выше
			}
		},
		async deleteSignature(signId: number) {
			try {
				console.log("🗑️ Удаляем подпись с ID:", signId);

				const response: any = await useFetchApi(`/api/sign/${signId}`, {
					method: "DELETE",
				});

				console.log("✅ Подпись удалена:", response);
				return response.body.sign;
			} catch (error) {
				console.error("❌ Ошибка при удалении подписи:", error);
				handleApiError(error);
				throw error;
			}
		},
		async getDocumentsByUserId(userId: any) {
			try {
				const response: any = await useFetchApi(`/api/admin/document/user/${userId}`);
				this.$patch({ documents: response.body.documents });
				return response.body.documents;
			} catch (error) {
				handleApiError(error);
			}
		},
		async getDocumentsByLeadId(leadId: any) {
			try {
				const response: any = await useFetchApi(`/api/admin/lead/document/${leadId}`);
				console.log(response.body.documents);
				this.$patch({ documents: response.body.documents });
				return response.body.documents;
			} catch (error) {
				handleApiError(error);
			}
		},
		async getUserByRole(role: string) {
			try {
				const response: any = await useFetchApi(`/api/user/role/${role}`);
				this.$patch({ users: response.body.user });
				return response.body.user;
			} catch (error: any) {
				handleApiError(error);
			}
		},
		async deleteUser(id: number) {
			try {
				const response: any = await useFetchApi(`/api/admin/user/${id}`, {
					method: "DELETE",
				});
				this.$patch({ users: this.users.filter((u) => u.id !== id) });
				return response.body.user;
			} catch (error) {
				handleApiError(error);
			}
		},
		async updateUser(user: any) {
			try {
				const response: any = await useFetchApi(`/api/admin/user/${user.id}`, {
					method: "PUT",
					body: user,
				});
				this.$patch({ users: this.users.map((u) => (u.id === user.id ? response.body.user : u)) });
				return response.body.user;
			} catch (error) {
				handleApiError(error);
			}
		},
		// new method to patch user
		async patchUser(user: any) {
			try {
				const response: any = await useFetchApi(`/api/admin/user/${user.id}`, {
					method: "PATCH",
					body: user,
				});
				this.$patch({ users: this.users.map((u) => (u.id === user.id ? response.body.user : u)) });
				return response.body.user;
			} catch (error) {
				handleApiError(error);
			}
		},
		async createUser(user: any) {
			try {
				const response: any = await useFetchApi("/api/admin/user/new", {
					method: "POST",
					body: user,
				});
				this.$patch({ users: [...this.users, response.body.user] });
				return response.body.user;
			} catch (error) {
				handleApiError(error);
			}
		}
	},
});

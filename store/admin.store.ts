import { useFetchApi } from "~/utils/api";
import { handleApiError } from "~/utils/errorHandler";
import type { User } from "@prisma/client";
import type {
	CreateDocumentPayload,
	CreateLeadPayload,
	CreateUserPayload,
	DeleteResponse,
	Document,
	DocumentResponse,
	DocumentsResponse,
	Lead,
	LeadResponse,
	LeadsResponse,
	Organization,
	OrganizationResponse,
	OrganizationsResponse,
	SignResponse,
	UpdateDocumentPayload,
	UpdateLeadPayload,
	UpdateUserPayload,
	UserResponse,
	UsersResponse,
} from "~/store/user.store";

/**
 * Canonical state и actions для admin-доменов: documents, leads, users, organizations, signing.
 *
 * **Статус миграции (см. docs/PREMIUM_REFACTOR.md):**
 * - Этот store остаётся источником правды для state и actions.
 * - Для нового кода используйте фокусные фасадные store:
 *   [[useDocumentsStore]], [[useLeadsStore]], [[useUsersStore]], [[useOrganizationsStore]].
 * - Они проксируют этот store через computed-обёртки и method-делегаты.
 * - Когда все страницы перейдут на фасадные store, состояние можно физически
 *   перенести из admin.store туда, а admin.store удалить.
 *
 * **Также (отдельная задача):** `filteredDocuments` / `filteredLeads` — анти-паттерн state-копии,
 * должны стать `computed` от source-state. Требует обновления страниц с server-side pagination.
 */
interface AdminState {
	leads: Lead[];
	documents: Document[];
	users: User[];
	organizations: Organization[];
	filteredDocuments: Document[];
	filteredLeads: Lead[];
	unsignedDocuments: Document[];
	signedDocuments: Document[];
	trashDocuments: Document[];
}

const defaultValue: AdminState = {
	leads: [],
	documents: [],
	users: [],
	organizations: [],
	filteredDocuments: [],
	filteredLeads: [],
	unsignedDocuments: [],
	signedDocuments: [],
	trashDocuments: [],
};

export const useAdminStore = defineStore("admin", {
	state: (): AdminState => defaultValue,
	getters: {
		leadsGetter: (state): Lead[] => state.leads,
		documentsGetter: (state): Document[] => state.documents,
		organizationsGetter: (state): Organization[] => state.organizations,
		getDocumentById: (state) => (id: number): Document | undefined => {
			if (state.unsignedDocuments.length !== 0) {
				return state.unsignedDocuments.find((d) => d.id === id);
			}
			return state.documents.find((d) => d.id === id);
		},
		insignedDocumentsGetter: (state): Document[] => state.unsignedDocuments,
		getterUserById: (state) => (id: number): User | undefined =>
			state.users.find((u) => u.id === id),
		trashDocumentsGetter: (state): Document[] => state.trashDocuments,
	},
	actions: {
		// ─── Leads ──────────────────────────────────────────────────────────

		async createLead(lead: CreateLeadPayload): Promise<Lead | undefined> {
			try {
				const response = await useFetchApi("/api/admin/lead", {
					method: "POST",
					body: lead,
				}) as LeadResponse;
				this.$patch({ leads: [...this.leadsGetter, response.body.lead] });
				return response.body.lead;
			} catch (error) {
				handleApiError(error);
			}
		},

		async getLeadById(id: number): Promise<Lead | undefined> {
			try {
				const response = await useFetchApi(`/api/admin/lead/${id}`) as LeadResponse;
				return response.body.lead;
			} catch (error) {
				handleApiError(error);
			}
		},

		async updateLead(lead: UpdateLeadPayload): Promise<Lead | undefined> {
			try {
				const response = await useFetchApi(`/api/admin/lead/${lead.id}`, {
					method: "PUT",
					body: lead,
				}) as LeadResponse;
				this.$patch({
					leads: this.leadsGetter.map((l) => (l.id === lead.id ? response.body.lead : l)),
				});
				return response.body.lead;
			} catch (error) {
				handleApiError(error);
			}
		},

		async deleteLead(id: number): Promise<Lead | undefined> {
			try {
				const response = await useFetchApi(`/api/admin/lead/${id}`, {
					method: "DELETE",
				}) as LeadResponse;
				this.$patch({ leads: this.leadsGetter.filter((l) => l.id !== id) });
				return response.body.lead;
			} catch (error) {
				handleApiError(error);
			}
		},

		async getLeads(): Promise<Lead[] | undefined> {
			try {
				const response = await useFetchApi("/api/admin/lead") as LeadsResponse;
				this.$patch({ leads: response.body.leads });
				return response.body.leads;
			} catch (error) {
				handleApiError(error);
			}
		},

		async getLeadByUserId(userId: number | string | undefined): Promise<Lead[] | undefined> {
			try {
				if (!userId) {
					throw new Error("Необхідно вказати userId");
				}
				const response = await useFetchApi(`/api/admin/lead/user/${userId}`) as LeadsResponse;
				this.$patch({ leads: response.body.leads });
				return response.body.leads;
			} catch (error) {
				handleApiError(error);
			}
		},

		// ─── Organizations ──────────────────────────────────────────────────

		async getOrganizations(): Promise<Organization[] | undefined> {
			try {
				const response = await useFetchApi("/api/admin/organization") as OrganizationsResponse;
				this.$patch({ organizations: response.body.organizations });
				return response.body.organizations;
			} catch (error) {
				handleApiError(error);
			}
		},

		async createOrganization(data: { name: string; inn?: string | null }): Promise<Organization | undefined> {
			try {
				const response = await useFetchApi("/api/admin/organization", {
					method: "POST",
					body: data,
				}) as OrganizationResponse;
				this.$patch({
					organizations: [...this.organizationsGetter, response.body.organization],
				});
				return response.body.organization;
			} catch (error) {
				handleApiError(error);
			}
		},

		async deleteOrganization(id: number): Promise<Organization | undefined> {
			try {
				const response = await useFetchApi(`/api/admin/organization/${id}`, {
					method: "DELETE",
				}) as OrganizationResponse;
				this.$patch({
					organizations: this.organizationsGetter.filter((org) => org.id !== id),
				});
				return response.body.organization;
			} catch (error) {
				handleApiError(error);
			}
		},

		// ─── Documents ──────────────────────────────────────────────────────

		async createDocument(document: CreateDocumentPayload, file: File): Promise<Document | undefined> {
			try {
				const formData = new FormData();
				formData.append("title", document.title);
				formData.append("userId", String(document.userId));
				if (document.counterpartyId != null) formData.append("counterpartyId", String(document.counterpartyId));
				formData.append("file", file);
				formData.append("type", document.type);
				if (document.leadId != null) formData.append("leadId", String(document.leadId));
				if (document.moderatorId != null) formData.append("moderatorId", String(document.moderatorId));
				formData.append("status", document.status);

				const response = await useFetchApi("/api/admin/document", {
					method: "POST",
					body: formData,
				}) as DocumentResponse;

				this.$patch({ documents: [...this.documentsGetter, response.body.document] });
				return response.body.document;
			} catch (error) {
				handleApiError(error);
			}
		},

		async getAllDocuments(): Promise<Document[] | undefined> {
			try {
				const response = await useFetchApi("/api/admin/document") as DocumentsResponse;
				this.$patch({ documents: response.body.documents });
				return response.body.documents;
			} catch (error) {
				handleApiError(error);
			}
		},

		async getAllUnsignedDocuments(): Promise<Document[] | undefined> {
			try {
				const response = await useFetchApi("/api/admin/document/unsigned") as DocumentsResponse;
				this.$patch({ unsignedDocuments: response.body.documents });
				return response.body.documents;
			} catch (error) {
				handleApiError(error);
			}
		},

		async getUnsignedDocumentsByUserId(userId: number): Promise<Document[] | undefined> {
			try {
				const response = await useFetchApi(`/api/admin/document/unsigned/${userId}`) as DocumentsResponse;
				this.$patch({ unsignedDocuments: response.body.documents });
				return response.body.documents;
			} catch (error) {
				handleApiError(error);
			}
		},

		async getAllSignedDocuments(): Promise<Document[] | undefined> {
			try {
				const response = await useFetchApi("/api/admin/document/archive") as DocumentsResponse;
				this.$patch({ signedDocuments: response.body.documents });
				return response.body.documents;
			} catch (error) {
				handleApiError(error);
			}
		},

		async getTrashDocuments(): Promise<Document[] | undefined> {
			try {
				const response = await useFetchApi("/api/admin/document/trash") as DocumentsResponse;
				this.$patch({ trashDocuments: response.body.documents });
				return response.body.documents;
			} catch (error) {
				handleApiError(error);
			}
		},

		async getTrashDocumentsByUserId(userId: number): Promise<Document[] | undefined> {
			try {
				const response = await useFetchApi(`/api/admin/document/trash/${userId}`) as DocumentsResponse;
				this.$patch({ trashDocuments: response.body.documents });
				return response.body.documents;
			} catch (error) {
				handleApiError(error);
			}
		},

		async getSignedDocumentsByUserId(userId: number): Promise<Document[] | undefined> {
			try {
				const response = await useFetchApi(`/api/admin/document/archive/${userId}`) as DocumentsResponse;
				this.$patch({ signedDocuments: response.body.documents });
				return response.body.documents;
			} catch (error) {
				handleApiError(error);
			}
		},

		async restoreDocument(userId: number, documentId: number) {
			try {
				const response = await useFetchApi("/api/admin/document/trash/restore", {
					method: "POST",
					body: { userId, documentId },
				}) as DocumentResponse;

				const restored = response.body.document;
				if (restored) {
					this.$patch({
						documents: this.documentsGetter.map((d) => (d.id === restored.id ? restored : d)),
						trashDocuments: this.trashDocumentsGetter.filter((d) => d.id !== restored.id),
					});
				}
				return response.body;
			} catch (error) {
				handleApiError(error);
			}
		},

		async updateDocument(document: UpdateDocumentPayload): Promise<Document | undefined> {
			try {
				const response = await useFetchApi(`/api/admin/document/${document.id}`, {
					method: "PUT",
					body: document,
				}) as DocumentResponse;
				this.$patch({
					documents: this.documentsGetter.map((d) =>
						d.id === document.id ? response.body.document : d,
					),
				});
				return response.body.document;
			} catch (error) {
				handleApiError(error);
			}
		},

		async updateDocumentModerator(id: number, moderatorId: number): Promise<Document | undefined> {
			try {
				const response = await useFetchApi(`/api/admin/document/moder/${id}`, {
					method: "PATCH",
					body: { moderatorId },
				}) as DocumentResponse;
				this.$patch({
					documents: this.documentsGetter.map((d) => (d.id === id ? { ...d, moderatorId } : d)),
				});
				return response.body.document;
			} catch (error) {
				handleApiError(error);
			}
		},

		async deleteDocument(userId: number, id: number): Promise<string | undefined> {
			try {
				const response = await useFetchApi("/api/admin/document/delete", {
					method: "POST",
					body: { userId, documentId: id },
				}) as DeleteResponse;

				if (response.body.message === "Видалення підтверджено. Очікується підтвердження другого користувача.") {
					let updatedDocument: Document | undefined;
					const updatedDocuments = this.documentsGetter.map((d) => {
						if (d.id === id) {
							updatedDocument = { ...d, deleteSignCount: d.deleteSignCount + 1 };
							return updatedDocument;
						}
						return d;
					});

					const updatedTrash = this.trashDocumentsGetter.some((d) => d.id === id)
						? this.trashDocumentsGetter.map((d) => (d.id === id && updatedDocument ? updatedDocument : d))
						: updatedDocument
							? [...this.trashDocumentsGetter, updatedDocument]
							: this.trashDocumentsGetter;

					this.$patch({ documents: updatedDocuments, trashDocuments: updatedTrash });
				} else {
					this.$patch({
						documents: this.documentsGetter.filter((d) => d.id !== id),
						trashDocuments: this.trashDocumentsGetter.filter((d) => d.id !== id),
					});
				}

				return response.body.error || response.body.message;
			} catch (error) {
				handleApiError(error);
			}
		},

		async getDocumentsByUserId(userId: number | string): Promise<Document[] | undefined> {
			try {
				const response = await useFetchApi(`/api/admin/document/user/${userId}`) as DocumentsResponse;
				this.$patch({ documents: response.body.documents });
				return response.body.documents;
			} catch (error) {
				handleApiError(error);
			}
		},

		async getDocumentsByLeadId(leadId: number | string): Promise<Document[] | undefined> {
			try {
				const response = await useFetchApi(`/api/admin/lead/document/${leadId}`) as DocumentsResponse;
				this.$patch({ documents: response.body.documents });
				return response.body.documents;
			} catch (error) {
				handleApiError(error);
			}
		},

		// ─── Signing ────────────────────────────────────────────────────────

		async createSign(
			documentId: number,
			userId: number,
			signature: File,
			finalPdfFile: File,
			certInfo: Record<string, unknown> | undefined,
			stampData: Record<string, unknown>,
		) {
			try {
				if (!signature || signature.size === 0) {
					throw new Error("Файл подписи пустой или отсутствует");
				}
				if (!finalPdfFile || finalPdfFile.size === 0) {
					throw new Error("PDF файл пустой или отсутствует");
				}

				const formData = new FormData();
				formData.append("documentId", String(documentId));
				formData.append("userId", String(userId));
				formData.append("signature", signature);
				formData.append("finalPdfFile", finalPdfFile);
				formData.append("certInfo", JSON.stringify(certInfo));
				formData.append("stampData", JSON.stringify(stampData));

				const response = await useFetchApi("/api/sign", {
					method: "POST",
					body: formData,
				}) as SignResponse;

				return response.body.sign;
			} catch (error) {
				handleApiError(error);
				throw error;
			}
		},

		async deleteSignature(signId: number) {
			try {
				const response = await useFetchApi(`/api/sign/${signId}`, {
					method: "DELETE",
				}) as SignResponse;
				return response.body.sign;
			} catch (error) {
				handleApiError(error);
				throw error;
			}
		},

		// ─── Users ──────────────────────────────────────────────────────────

		async getUserByRole(role: string): Promise<User[] | undefined> {
			try {
				const response = await useFetchApi(`/api/user/role/${role}`) as UsersResponse;
				this.$patch({ users: response.body.user });
				return response.body.user;
			} catch (error) {
				handleApiError(error);
			}
		},

		async deleteUser(id: number): Promise<User | undefined> {
			try {
				const response = await useFetchApi(`/api/admin/user/${id}`, {
					method: "DELETE",
				}) as UserResponse;
				this.$patch({ users: this.users.filter((u) => u.id !== id) });
				return response.body.user;
			} catch (error) {
				handleApiError(error);
			}
		},

		async updateUser(user: UpdateUserPayload): Promise<User | undefined> {
			try {
				const response = await useFetchApi(`/api/admin/user/${user.id}`, {
					method: "PUT",
					body: user,
				}) as UserResponse;
				this.$patch({
					users: this.users.map((u) => (u.id === user.id ? response.body.user : u)),
				});
				return response.body.user;
			} catch (error) {
				handleApiError(error);
			}
		},

		async patchUser(user: UpdateUserPayload): Promise<User | undefined> {
			try {
				const response = await useFetchApi(`/api/admin/user/${user.id}`, {
					method: "PATCH",
					body: user,
				}) as UserResponse;
				this.$patch({
					users: this.users.map((u) => (u.id === user.id ? response.body.user : u)),
				});
				return response.body.user;
			} catch (error) {
				handleApiError(error);
			}
		},

		async createUser(user: CreateUserPayload): Promise<User | undefined> {
			try {
				const response = await useFetchApi("/api/admin/user/new", {
					method: "POST",
					body: user,
				}) as UserResponse;
				this.$patch({ users: [...this.users, response.body.user] });
				return response.body.user;
			} catch (error) {
				handleApiError(error);
			}
		},
	},
});

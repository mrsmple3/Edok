import type { Socket } from "socket.io-client";
import { useFetchApi } from "~/utils/api";
import { handleApiError } from "~/utils/errorHandler";

export interface ApiResponse<T> {
	code: number;
	body: T;
}

export interface DocumentDeleteSign {
	id: number | null;
	documentId: number;
	userId: number;
	createdAt: Date;
	user?: User;
}

export interface User {
	id?: number | null; // UUID
	email?: string; // Nullable
	phone?: string; // Nullable
	role: string;
	isActive: boolean;
	name?: string;
	password_hash: string; // Nullable
	organization_name?: string; // Nullable
	organization_INN?: string; // Nullable
	organizationId?: number | null;
	organization?: Organization | null;
	company_type?: string; // Nullable
	canDeleterDocuments: boolean;
	notificationEmail?: string | null;
	notificationsEnabled?: boolean;
	createdAt: Date;
}

export interface Organization {
	id: number;
	name: string;
	inn?: string | null;
	createdAt: Date;
}

export interface Document {
	id: number;
	title: string;
	file: File;
	filePath?: string;
	userId: string;
	type?: string;
	status?: string;
	content?: string;
	deleteSignCount: number;
	counterpartyId?: number;
	counterparty: User;
	leadId?: number;
	lead: Lead;
	user: User;
	deleteSigns: DocumentDeleteSign[];
	createdAt: Date;
}

export interface Lead {
	id: number;
	name: string;
	type: string;
	moderatorsId: number;
	moderators?: User | null;
	counterpartyId: number;
	counterparty?: User | null;
	authorId: number;
	documents: Document[];
	status: string;
	createdAt: Date;
	author: User;
	organizationId?: number | null;
	organization?: Organization | null;
}
export interface Message {
	id: number;
	content: string;
	senderId: number;
	room: string;
	createdAt: Date;
}

export interface Signature {
	id: number;
	signature: string;
	documentId: number;
	document: Document;
	userId: number;
	user: User;
	createdAt: Date;
}

export interface CreateDocumentPayload {
	title: string;
	userId: number | string;
	counterpartyId?: number | null;
	moderatorId?: number | null;
	leadId?: number | null;
	type: string;
	content: string;
	status: string;
}

export interface UpdateDocumentPayload {
	id: number;
	title?: string;
	type?: string;
	status?: string;
	content?: string;
}

export interface CreateLeadPayload {
	name?: string;
	type: string;
	moderatorsId?: number | null;
	counterpartyId?: number | null;
	authorId: number;
	organizationId?: number | null;
}

export interface UpdateLeadPayload extends Partial<CreateLeadPayload> {
	id: number;
	status?: string;
}

export interface CreateUserPayload {
	email?: string | null;
	phone?: string | null;
	password_hash?: string;
	role: string;
	name?: string;
	organization_name?: string;
	organization_INN?: string;
	organizationId?: number | null;
	company_type?: string;
}

export interface UpdateUserPayload extends Partial<CreateUserPayload> {
	id: number;
	isActive?: boolean;
}

export interface UserResponse extends ApiResponse<{ user: User }> { }
export interface UsersResponse extends ApiResponse<{ user: User[] }> { }
export interface LeadResponse extends ApiResponse<{ lead: Lead }> { }
export interface LeadsResponse extends ApiResponse<{ leads: Lead[] }> { }
export interface TokenResponse extends ApiResponse<{ token?: string; error?: string }> { }
export interface ErrorResponse extends ApiResponse<{ error: string }> { }
export interface MessageResponse extends ApiResponse<{ message: string }> { }
export interface DocumentResponse extends ApiResponse<{ document: Document }> { }
export interface DocumentsResponse extends ApiResponse<{ documents: Document[] }> { }
export interface ModeratorsResponse extends ApiResponse<{ user: User[] }> { }
export interface OrganizationResponse extends ApiResponse<{ organization: Organization }> { }
export interface OrganizationsResponse extends ApiResponse<{ organizations: Organization[] }> { }
export interface SignResponse extends ApiResponse<{ sign: Signature }> { }
export interface DeleteResponse extends ApiResponse<{ message: string; error?: string; document?: Document }> { }

export interface NotificationRecipient {
	id: number;
	email: string;
	label?: string | null;
	enabled: boolean;
	createdAt: Date;
}
export interface NotificationRecipientResponse extends ApiResponse<{ recipient: NotificationRecipient }> { }
export interface NotificationRecipientsResponse extends ApiResponse<{ recipients: NotificationRecipient[] }> { }

const defaultValue: {
	token: string;
	user: User;
	leads: Lead[];
	isAuth: boolean;
	isAuthInitialized: boolean;
	moderators: User[];
	counterparties: User[];
	socket: Socket | undefined;
	messages: Message[];
	notificationRecipients: NotificationRecipient[];
} = {
	token: "",
	user: {
		id: null,
		email: "",
		phone: "",
		name: "",
		password_hash: "",
		company_type: "",
		organization_name: "",
		organization_INN: "",
		organizationId: null,
		organization: null,
		isActive: false,
		role: "",
		canDeleterDocuments: false,
		createdAt: new Date(),
	},
	leads: [],
	isAuth: false,
	isAuthInitialized: false,
	moderators: [],
	counterparties: [],
	socket: undefined,
	messages: [],
	notificationRecipients: [],
};

export const useUserStore = defineStore("auth", {
	state: () => defaultValue,
	getters: {
		userGetter: (state): User => state.user,
		tokenGetter: (state): string => state.token,
		moderatorsGetter: (state): User[] => state.moderators,
		counterpartiesGetter: (state): User[] => state.counterparties,
		userRole: (state) => state.user.role,
	},
	actions: {
		async register(user: User) {
			try {
				const response = await $fetch<UserResponse>("/api/auth/register", {
					method: "POST",
					body: user,
				});

				this.$patch({ user: response.body.user });
				return response;
			} catch (error: unknown) {
				handleApiError(error);
			}
		},
		async login({ email, phone, password_hash }: { email?: string; phone?: string; password_hash: string }) {
			try {
				if (!email && !phone) {
					throw new Error("Необходимо указать либо email, либо phone");
				}

				const response = await $fetch<UserResponse>("/api/auth/login", {
					method: "POST",
					body: { email, phone, password_hash },
				});

				this.$patch({ user: response.body.user });
				return response;
			} catch (error: unknown) {
				handleApiError(error);
			}
		},
		async logout() {
			try {
				await useFetchApi("/api/auth/logout", {
					method: "POST",
				});
				this.$patch({ user: defaultValue.user, token: defaultValue.token });
			} catch (error: unknown) {
				handleApiError(error);
			}
		},
		async refreshToken() {
			try {
				const response = await $fetch<TokenResponse>("/api/auth/refresh");
				this.$patch({ token: response.body.token });
				return response;
			} catch (error: unknown) {
				handleApiError(error);
			}
		},
		async getUser(): Promise<UserResponse | undefined> {
			try {
				const response = await useFetchApi("/api/auth/user", {
					method: "GET",
				}) as UserResponse;

				this.$patch({ user: response.body.user });
				return response;
			} catch (error: unknown) {
				handleApiError(error);
			}
		},
		async initAuth() {
			try {
				await this.refreshToken();
				const user = await this.getUser();
				this.isAuth = !!user?.body.user.id;
			} catch (error: unknown) {
				handleApiError(error);
			} finally {
				this.isAuthInitialized = true;
			}
		},
		async updateUser(user: UpdateUserPayload): Promise<UserResponse | undefined> {
			try {
				const response = await useFetchApi(`/api/admin/user/${user.id}`, {
					method: "PUT",
					body: user,
				}) as UserResponse;
				this.$patch({ user: response.body.user });
				return response;
			} catch (error: unknown) {
				handleApiError(error);
			}
		},
		async updateNotificationSettings(payload: { notificationEmail?: string | null; notificationsEnabled?: boolean }) {
			try {
				const response = await useFetchApi(`/api/auth/profile/notifications`, {
					method: "PATCH",
					body: payload,
				}) as UserResponse;
				const updated = response.body.user;
				if (this.user) {
					this.$patch({
						user: {
							...this.user,
							notificationEmail: updated.notificationEmail,
							notificationsEnabled: updated.notificationsEnabled,
						},
					});
				}
				return response;
			} catch (error: unknown) {
				handleApiError(error);
			}
		},
		async toggleDocumentNotifications(documentId: number, enabled: boolean): Promise<Document | undefined> {
			try {
				const response = await useFetchApi(`/api/admin/document/notifications/${documentId}`, {
					method: "PATCH",
					body: { notificationsEnabled: enabled },
				}) as DocumentResponse;
				return response.body.document;
			} catch (error: unknown) {
				handleApiError(error);
			}
		},
		async getNotificationRecipients(): Promise<NotificationRecipient[] | undefined> {
			try {
				const response = await useFetchApi(`/api/admin/notification-recipient`) as NotificationRecipientsResponse;
				this.$patch({ notificationRecipients: response.body.recipients });
				return response.body.recipients;
			} catch (error: unknown) {
				handleApiError(error);
			}
		},
		async addNotificationRecipient(payload: { email: string; label?: string | null }): Promise<NotificationRecipient | undefined> {
			try {
				const response = await useFetchApi(`/api/admin/notification-recipient`, {
					method: "POST",
					body: payload,
				}) as NotificationRecipientResponse;
				this.$patch({ notificationRecipients: [...this.notificationRecipients, response.body.recipient] });
				return response.body.recipient;
			} catch (error: unknown) {
				handleApiError(error);
			}
		},
		async updateNotificationRecipient(id: number, payload: { email?: string; label?: string | null; enabled?: boolean }): Promise<NotificationRecipient | undefined> {
			try {
				const response = await useFetchApi(`/api/admin/notification-recipient/${id}`, {
					method: "PATCH",
					body: payload,
				}) as NotificationRecipientResponse;
				const updated = response.body.recipient;
				this.$patch({
					notificationRecipients: this.notificationRecipients.map((r) => (r.id === id ? updated : r)),
				});
				return updated;
			} catch (error: unknown) {
				handleApiError(error);
			}
		},
		async deleteNotificationRecipient(id: number): Promise<boolean> {
			try {
				await useFetchApi(`/api/admin/notification-recipient/${id}`, { method: "DELETE" });
				this.$patch({ notificationRecipients: this.notificationRecipients.filter((r) => r.id !== id) });
				return true;
			} catch (error: unknown) {
				handleApiError(error);
				return false;
			}
		},
		async getUserByRole(role: string): Promise<User[] | undefined> {
			try {
				const response = await useFetchApi(`/api/user/role/${role}`) as UsersResponse;
				return response.body.user;
			} catch (error: unknown) {
				handleApiError(error);
			}
		},
		async getModerators(): Promise<User[] | undefined> {
			try {
				const response = await useFetchApi(`/api/user/role/moderator`) as UsersResponse;
				this.$patch({ moderators: response.body.user });
				return response.body.user;
			} catch (error: unknown) {
				handleApiError(error);
			}
		},
		async getCounterparties(): Promise<void> {
			try {
				const response = await useFetchApi(`/api/user/role/counterparty`) as UsersResponse;
				this.$patch({ counterparties: response.body.user });
			} catch (error: unknown) {
				handleApiError(error);
			}
		},
		async getUserById(id: number): Promise<User | undefined> {
			try {
				const response = await useFetchApi(`/api/user/${id}`) as UserResponse;
				return response.body.user;
			} catch (error: unknown) {
				handleApiError(error);
			}
		},
		async getMessages(messages: Message[]) {
			this.$patch({ messages: messages });
			return messages;
		},
		async setMessages(message: Message[]) {
			this.$patch({ messages: message });
			return message;
		},
		async setMessage(message: Message) {
			this.$patch({ messages: [...this.messages, message] });
			return message;
		},
		async toSign(document: Document): Promise<Document | undefined> {
			try {
				const response = await useFetchApi(`/api/sign`, {
					method: "POST",
					body: document,
				}) as DocumentResponse;
				return response.body.document;
			} catch (error: unknown) {
				handleApiError(error);
			}
		},
	},
});

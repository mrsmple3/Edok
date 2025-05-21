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
	company_type?: string; // Nullable
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

export interface UserResponse extends ApiResponse<{ user: User }> { }
export interface LeadsResponse extends ApiResponse<{ leads: Lead[] }> { }
export interface TokenResponse extends ApiResponse<{ token?: string; error?: string }> { }
export interface ErrorResponse extends ApiResponse<{ error: string }> { }
export interface MessageResponse extends ApiResponse<{ message: string }> { }
export interface DocumentResponse extends ApiResponse<{ document: Document }> { }
export interface ModeratorsResponse extends ApiResponse<{ user: User[] }> { }

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
		isActive: false,
		role: "",
		createdAt: new Date(),
	},
	leads: [],
	isAuth: false,
	isAuthInitialized: false,
	moderators: [],
	counterparties: [],
	socket: undefined,
	messages: [],
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
			} catch (error: any) {
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
			} catch (error: any) {
				handleApiError(error);
			}
		},
		async logout() {
			try {
				const response = await useFetchApi("/api/auth/logout", {
					method: "POST",
				});

				this.$patch({ user: defaultValue.user, token: defaultValue.token });
			} catch (error) {
				console.error("Error logging out:", error);
				handleApiError(error);
			}
		},
		async refreshToken() {
			try {
				const response = await $fetch<TokenResponse>("/api/auth/refresh");
				this.$patch({ token: response.body.token });
				return response;
			} catch (error: any) {
				handleApiError(error);
			}
		},
		async getUser() {
			try {
				const response: any = await useFetchApi("/api/auth/user", {
					method: "GET",
				});

				this.$patch({ user: response.body.user });
				return response;
			} catch (error: any) {
				handleApiError(error);
			}
		},
		async initAuth() {
			try {
				const refresh = await this.refreshToken();
				const user = await this.getUser();
				this.isAuth = !!user.body.user.id;
			} catch (error: any) {
				handleApiError(error);
			} finally {
				this.isAuthInitialized = true;
			}
		},
		async updateUser(user: any) {
			try {
				const response = await $fetch<any>(`api/admin/user/${user.id}`, {
					method: "PUT",
					body: user,
				});
				this.$patch({ user: response.body.user });
				return response;
			} catch (error: any) {
				handleApiError(error);

			}
		},
		async getUserByRole(role: string) {
			try {
				const response = await $fetch<UserResponse>(`/api/user/role/${role}`);
				return response.body.user;
			} catch (error: any) {
				handleApiError(error);
			}
		},
		async getModerators() {
			try {
				const response = await $fetch<ModeratorsResponse>(`/api/user/role/moderator`);
				this.$patch({ moderators: response.body.user });
				return response.body.user;
			} catch (error: any) {
				handleApiError(error);
			}
		},
		async getCounterparties() {
			try {
				const response = await $fetch<ModeratorsResponse>(`/api/user/role/counterparty`);
				this.$patch({ counterparties: response.body.user });
			} catch (error: any) {
				handleApiError(error);
			}
		},
		async getUserById(id: number) {
			try {
				const response = await $fetch<UserResponse>(`/api/user/${id}`);
				return response.body.user;
			} catch (error: any) {
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
		async toSign(document: Document) {
			try {
				const response = await $fetch<DocumentResponse>(`/api/sign`, {
					method: "POST",
					body: document,
				});
				return response.body.document;
			} catch (error: any) {
				handleApiError(error);
			}
		},
	},
});

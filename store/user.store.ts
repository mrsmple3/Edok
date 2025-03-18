import { useFetchApi } from "~/utils/api";
import { handleApiError } from "~/utils/errorHandler";

export interface ApiResponse<T> {
	code: number;
	body: T;
}

export interface User {
	id?: number | null; // UUID
	email?: string; // Nullable
	phone?: string; // Nullable
	role: string;
	password_hash: string; // Nullable
	organization_name?: string; // Nullable
	organization_INN?: string; // Nullable
	company_type?: string; // Nullable
}

export interface Document {
	id: string;
	title: string;
	file: File;
	filePath?: string;
	userId: string;
	type?: string;
	status?: string;
	content?: string;
	deleteSignCount: number;
	counterpartyId?: number;
	leadId?: number;
	createdAt: Date;
}

export interface Lead {
	id: number;
	type: string;
	quantity: number;
	moderatorsId: number;
	contragentId: number;
	authorId: number;
	documents: Document;
	status: string;
	createdAt: Date;
}

export interface UserResponse extends ApiResponse<{ user: User }> {}
export interface LeadsResponse extends ApiResponse<{ leads: Lead[] }> {}
export interface TokenResponse extends ApiResponse<{ token?: string; error?: string }> {}
export interface ErrorResponse extends ApiResponse<{ error: string }> {}
export interface MessageResponse extends ApiResponse<{ message: string }> {}
export interface DocumentResponse extends ApiResponse<{ document: Document }> {}

const defaultValue: {
	token: string;
	user: User;
	leads: Lead[];
} = {
	token: "",
	user: {
		id: null,
		email: "",
		phone: "",
		password_hash: "",
		company_type: "",
		organization_name: "",
		organization_INN: "",
		role: "",
	},
	leads: [],
};

export const useUserStore = defineStore("auth", {
	state: () => defaultValue,
	getters: {
		userGetter: (state): User => state.user,
		tokenGetter: (state): string => state.token,
		isAuth: (state): boolean => !!state.token,
		leadsGetter: (state): Lead[] => state.leads,
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
			} catch (error: any) {
				handleApiError(error);
			}
		},
		async getLeads(userId: number) {
			try {
				const response: any = await useFetchApi(`/api/user/leads/${userId}`, {
					method: "GET",
				});
				this.$patch({ leads: response.body.leads });
				return response;
			} catch (error: any) {
				handleApiError(error);
			}
		},
	},
});

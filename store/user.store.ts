import {useFetchApi} from "~/utils/api";

export interface ApiResponse<T> {
    code: number;
    body: T;
}

export interface User {
    id?: number,// UUID
    email?: string,// Nullable
    phone?: string,// Nullable
    password_hash: string,// Nullable
    company_type?: string,// Nullable
    region?: string,// Nullable
    district?: string,// Nullable
    city?: string,// Nullable
    address?: string,// Nullable
    iban?: string,// Nullable
    bank_name?: string,// Nullable
    mfo?: string,// Nullable
    business_activity?: string,// Nullable
    partner_organization?: string,// Nullable
    agreed_to_terms?: boolean,// Nullable
}

export interface Document {
    id: string,
    title: string,
    file: File,
    userId: string,
}

export interface Lead {
    id: number,
    type: string,
    quantity: number,
    documentsQuantity: number,
    moderators: string,
    createdAt: Date,
    contragent: string,
    documentsId: number,
    authorId: number,
    author: User,
    documents: Document,
}

export interface UserResponse extends ApiResponse<{ user: User }> {}
export interface LeadsResponse extends ApiResponse<{ leads: Lead[] }> {}
export interface TokenResponse extends ApiResponse<{ token: string }> {}
export interface ErrorResponse extends ApiResponse<{ error: string }> {}

const defaultValue:
    {
        token: string,
        user: User,
        leads: Lead[],
    } = {
    token: '',
    user: {
        id: null,
        email: '',
        phone: '',
        password_hash: '',
        company_type: '',
        region: '',
        district: '',
        city: '',
        address: '',
        iban: '',
        bank_name: '',
        mfo: '',
        business_activity: '',
        partner_organization: '',
        agreed_to_terms: false,
    },
    leads: [],
}

export const useUserStore = defineStore('auth', {
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
                const response = await $fetch<UserResponse>('/api/auth/register', {
                   method: 'POST',
                    body: user,
                });
                this.$patch({user: response.body.user});
                return response;
            } catch (error: any) {
                throw error;
            }
        },
        async login(user: User) {
            try {
                const response = await $fetch<UserResponse>('/api/auth/login', {
                    method: 'POST',
                    body: user,
                });
                this.$patch({user: response.body.user});
                return response;
            } catch (error: any) {
                throw error;
            }
        },
        async logout() {
            try {
                await useFetchApi('/api/auth/logout', {
                    method: 'POST',
                });
                this.$patch({user: defaultValue.user, token: defaultValue.token});
            } catch (error) {
                console.error("Error logging out:", error);
                throw error;
            }
        },
        async refreshToken() {
            try {
                const response = await $fetch<TokenResponse>("/api/auth/refresh");
                this.$patch({token: response.body.token});
                return response;
            } catch (error) {
                console.error("Error refreshing token:", error);
                throw error;
            }
        },
        async getUser() {
            try {
                const response: any = await useFetchApi('/api/auth/user', {
                    method: 'GET',
                });
                this.$patch({user: response.body.user});
                return response;
            } catch (error: any) {
                throw error;
            }
        },
        async initAuth() {
            try {
                const refresh = await this.refreshToken();
                if (refresh.body.error) {
                    return;
                }
                await this.getUser();
            } catch (error) {
                console.error("Error initializing auth:", error);
                throw error;
            }
        },
        async getLeads(userId: number) {
            try {
                const response: any = await useFetchApi(`/api/user/leads/${userId}`, {
                    method: 'GET',
                });
                this.$patch({leads: response.body.leads});
                return response;
            } catch (error: any) {
                throw error;
            }
        }
    }
})
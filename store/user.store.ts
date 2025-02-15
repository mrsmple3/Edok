interface TokenRefresh {
    refresh: string,// JWT
    access: string,// JWT
}

export interface User {
    id: string,// UUID
    first_name: string,// Nullable
    last_name: string,// Nullable
    patronymic_name: string,// Nullable
    phone: string,// Nullable
    avatar: string,// Nullable, URI
    role: string,// Nullable
}

export interface UserUpdate {
    first_name: string;
    last_name: string;
    patronymic_name: string;
    avatar: string;
    birthday: string;
    email: string;
}

export interface RestaurantMetaData {
    id: string; // UUID
    rest_id: string; // UUID
    wifi_name?: string; // Nullable
    wifi_pass?: string; // Nullable
    phone?: string; // Nullable
    photo?: string; // Nullable, URI
    description?: string; // Nullable
    start_work_time?: string; // Nullable
    end_work_time?: string; // Nullable
}

export interface ReturnLoginOrRegisterUser {
    access: string,
    refresh: string,
    id_user: string,
    role: string,
}

const defaultValue:
    {
        url: string,
        anonim: Anonim,
        media: RestaurantMetaData,
        returnUser: ReturnLoginOrRegisterUser,
        refresh: TokenRefresh,
        user: User
    } = {
    url: "https://api.teastymenu.ru/",
    anonim: {
        id: '',
        session_id: '',
        avatar_url: '',
        name: '',
    },
    media: {
        id: '',
        rest_id: '',
        wifi_name: '',
        wifi_pass: '',
        phone: '',
        photo: '',
        discription: '',
        start_work_time: '',
        end_work_time: '',
    },
    returnUser: {
        access: '',
        refresh: '',
        id_user: '',
        role: '',
    },
    refresh: {
        refresh: '',
        access: '',
    },
    user: {
        id: '',
        first_name: '',
        last_name: '',
        patronymic_name: '',
        phone: '',
        avatar: '',
        role: '',
    }
}

export const useAuthStore = defineStore('auth', {
    state: () => defaultValue,
    getters: {
        userGetter: (state): User => state.user,
        isUserAdmin: state => state.user.role.includes('admin'),
        isAuthenticated: (state): boolean => !!state.user.id,
        currentUser: (state) => state.user.id ? state.user : state.anonim,
        currentUserId: (state) => state.user.id ? state.user.id : state.anonim.session_id,
        currentAvatar: (state) => state.user.id ? state.user.avatar : state.anonim.avatar_url,
        currentName: (state) => state.user.id ? state.user.first_name : state.anonim.name,
        currentUserAvatar: (state) => (order) => order.user ? order.user.avatar : order.anonim.avatar_url,
    },
    actions: {
        async createAnonimUser(anonim: Anonim) {
            try {
                const response = await $fetch(`${this.url}api/anonim/`, {
                    method: "POST",
                    body: {
                        session_id: anonim.session_id,
                        meta_data: anonim.media_data,
                    }
                });
                this.$patch({anonim: response});
            } catch (error) {
                console.error("Error creating anonim user:", error);
            }
        },
        async fetchAnonimUser(session_id: string) {
            try {
                const response = await $fetch(`${this.url}api/anonim/${session_id}/`);
                if (response.message === 'This session_id not found anonim user') {
                    return false;
                }
                this.$patch({anonim: response});
            } catch (error) {
                console.error("Error fetching anonim user:", error);
            }
        },
        async fetchMedia(rest_id: string) {
            try {
                const response: RestaurantMetaData = await $fetch(`${this.url}api/user/restaurant/meta/${rest_id}/`);
                this.$patch({media: response});
            } catch (error) {
                console.error("Error fetching media:", error);
            }
        },
        async register({phone, password, role, session_id, meta_data}) {
            try {
                const response: ReturnLoginOrRegisterUser = await $fetch('https://api.teastymenu.ru/api/register/', {
                    method: 'POST',
                    body: {
                        phone: phone,
                        password: password,
                        role: role,
                        session_id: session_id,
                        meta_data: meta_data
                    },
                });
                this.$patch({returnUser: response});
                localStorage.setItem('access_token', response.access);
                localStorage.setItem('refresh_token', response.refresh);
            } catch (error) {
                console.log('Ошибка при регистрации:', error);
            }
        },
        async login({phone, password, media_data = 'test_meta_data', remember = true}) {
            try {
                const response: ReturnLoginOrRegisterUser = await $fetch('https://api.teastymenu.ru/api/login/', {
                    method: 'POST',
                    body: {
                        phone: phone,
                        password: password,
                        meta_data: media_data,
                    },
                });
                this.$patch({returnUser: response});

                localStorage.setItem('access_token', response.access);
                localStorage.setItem('refresh_token', response.refresh);
            } catch (error) {
                console.log('Ошибка при входе:', error);
            }
        },
        async refreshToken() {
            try {
                const refreshToken = localStorage.getItem('refresh_token');
                if (!refreshToken) throw new Error('Refresh token not found');

                const response: TokenRefresh = await useFetchApi('https://api.teastymenu.ru/api/refresh/', {
                    method: 'POST',
                    body: {
                        refresh: refreshToken,
                    },
                });

                this.$patch({refresh: response});
                localStorage.setItem('access_token', response.access);
                localStorage.setItem('refresh_token', response.refresh);
            } catch (error) {
                console.log('Ошибка при обновлении токена:', error);
            }
        },
        async initAuth() {
            try {
                await this.refreshToken().then(async () => {
                    await this.getUser();
                });
            } catch (error) {
                console.error("Error initializing auth:", error);
                throw error;
            }
        },
        async getUser() {
            try {
                const response: User = await useFetchApi("https://api.teastymenu.ru/api/user/");
                this.$patch({user: response});
            } catch (error) {
                console.error("Error getting user:", error);
                throw error;
            }
        },
        async logout() {
            try {
                localStorage.removeItem('access_token');
                localStorage.removeItem('refresh_token');
                this.$reset();
            } catch (error) {
                console.error("Error logging out:", error);
                throw error;
            }
        },
        async updateUser(user: UserUpdate) {
            try {
                const response: User = await useFetchApi('https://api.teastymenu.ru/api/user/', {
                    method: 'PUT',
                    body: user,
                });
                this.$patch({user: response});
            } catch (error) {
                console.error("Error updating user:", error);
                throw error;
            }
        },
    }
})
import {useUserStore} from "~/store/user.store";

export async function useFetchApi(url: string, options: Record<string, any> = {}) {
    const userStore = useUserStore();

    return await $fetch(url, {
        ...options,
        headers: {
            ...options.headers,
            Authorization: `Bearer ${userStore.tokenGetter}`,
        },
        method: options.method as "POST" | "GET" | "PUT" | "DELETE" | "PATCH" | "HEAD" | "OPTIONS" | "CONNECT" | "TRACE" | undefined,
    });
}
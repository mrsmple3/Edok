// import {useUserStore} from '~/store/user.auth';
//
// export async function useFetchApi(url: string, options: RequestInit = {}) {
//     const userStore = useUserStore();
//
//     return await $fetch(url, {
//         ...options,
//         headers: {
//             ...options.headers,
//             Authorization: `Bearer ${userStore.accessToken}`,
//         },
//         method: options.method as "POST" | "GET" | "PUT" | "DELETE" | "PATCH" | "HEAD" | "OPTIONS" | "CONNECT" | "TRACE" | undefined,
//     });
// }
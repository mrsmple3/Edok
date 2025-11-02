import { useUserStore } from "../store/user.store";

export default defineNuxtRouteMiddleware(async (to, from) => {
  // Список публичных страниц, которые не требуют авторизации
  const publicPages = ['/login', '/register'];

  // Проверяем, является ли текущая страница публичной
  const isPublicPage = publicPages.some(page => to.path.startsWith(page));

  // Если это публичная страница, пропускаем проверку
  if (isPublicPage) {
    return;
  }

  // Проверяем авторизацию только на клиенте
  if (process.client) {
    const userStore = useUserStore();

    try {
      // Показываем loader во время проверки авторизации
      const { showLoader, hideLoader } = usePageLoader();

      // Показываем loader только если авторизация еще не инициализирована
      if (!userStore.$state.isAuthInitialized) {
        showLoader();
      }

      // Ждем завершения инициализации авторизации
      if (!userStore.$state.isAuthInitialized) {
        console.log('Initializing auth...');
        await userStore.initAuth();
      }

      // Скрываем loader после проверки
      hideLoader();

      // Проверяем, авторизован ли пользователь
      if (!userStore.$state.isAuth || !userStore.$state.user?.id) {
        console.log('User not authenticated, redirecting to login');
        return navigateTo('/login');
      }

      console.log('User authenticated:', userStore.$state.user.email || userStore.$state.user.phone);
    } catch (error) {
      // Скрываем loader в случае ошибки
      const { hideLoader } = usePageLoader();
      hideLoader();

      // Если произошла ошибка, перенаправляем на login
      console.error('Auth check failed:', error);
      return navigateTo('/login');
    }
  }
});

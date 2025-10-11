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
    try {
      const refresh = await $fetch('/api/auth/refresh');

      // Делаем запрос для проверки авторизации
      const response = await $fetch('/api/auth/user', {
        method: 'GET'
      });

      // Проверяем, что пользователь авторизован
      if (!response || response.code !== 200 || !response.body?.user?.id) {
        console.log('User not authenticated, redirecting to login');
        return navigateTo('/login');
      }

      console.log('User authenticated:', response.body.user);
    } catch (error) {
      // Если произошла ошибка (например, 401), перенаправляем на login
      console.error('Auth check failed:', error);
      return navigateTo('/login');
    }
  }
});

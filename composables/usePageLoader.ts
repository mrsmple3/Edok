export const usePageLoader = () => {
  const isLoading = useState('pageLoading', () => false);

  const showLoader = () => {
    isLoading.value = true;
  };

  const hideLoader = () => {
    isLoading.value = false;
  };

  /**
   * Выполняет асинхронную функцию с автоматическим управлением loader
   * @param fn - асинхронная функция для выполнения
   * @returns результат выполнения функции
   */
  const withLoader = async <T>(fn: () => Promise<T>): Promise<T> => {
    try {
      showLoader();
      const result = await fn();
      return result;
    } finally {
      hideLoader();
    }
  };

  return {
    isLoading,
    showLoader,
    hideLoader,
    withLoader,
  };
};

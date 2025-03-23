export const handleApiError = (error: any) => {
	if (error.response && error.response._data) {
		const errorMessage = (error.response._data && error.response._data.body.error) || "Неизвестная ошибка";
		throw new Error(errorMessage);
	} else {
		console.log("Ошибка при входе:", error);
		throw new Error("Неизвестная ошибка");
	}
};

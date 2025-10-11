// Тестовая версия функции транслитерации
function transliterate(text) {
	const translitMap = {
		// Русские символы
		а: "a",
		б: "b",
		в: "v",
		г: "g",
		д: "d",
		е: "e",
		ё: "yo",
		ж: "zh",
		з: "z",
		и: "i",
		й: "y",
		к: "k",
		л: "l",
		м: "m",
		н: "n",
		о: "o",
		п: "p",
		р: "r",
		с: "s",
		т: "t",
		у: "u",
		ф: "f",
		х: "h",
		ц: "ts",
		ч: "ch",
		ш: "sh",
		щ: "sch",
		ъ: "",
		ы: "y",
		ь: "",
		э: "e",
		ю: "yu",
		я: "ya",
		А: "A",
		Б: "B",
		В: "V",
		Г: "G",
		Д: "D",
		Е: "E",
		Ё: "Yo",
		Ж: "Zh",
		З: "Z",
		И: "I",
		Й: "Y",
		К: "K",
		Л: "L",
		М: "M",
		Н: "N",
		О: "O",
		П: "P",
		Р: "R",
		С: "S",
		Т: "T",
		У: "U",
		Ф: "F",
		Х: "H",
		Ц: "Ts",
		Ч: "Ch",
		Ш: "Sh",
		Щ: "Sch",
		Ъ: "",
		Ы: "Y",
		Ь: "",
		Э: "E",
		Ю: "Yu",
		Я: "Ya",
		// Украинские символы
		і: "i",
		ї: "yi",
		є: "ye",
		ґ: "g",
		І: "I",
		Ї: "Yi",
		Є: "Ye",
		Ґ: "G",
	};

	return text.replace(/[а-яё іїєґА-ЯЁ ІЇЄҐ]/g, (char) => {
		return translitMap[char] || char;
	});
}

function createSafeFileName(originalName) {
	// Убираем расширение
	const nameWithoutExt = originalName.replace(/\.[^/.]+$/, "");

	// Транслитерируем кириллические символы
	const transliterated = transliterate(nameWithoutExt);

	// Заменяем все кроме латинских букв, цифр, _ и - на _
	// Убираем множественные _ и _ в начале/конце
	const cleanName = transliterated
		.replace(/[^a-zA-Z0-9_-]/g, "_")
		.replace(/_+/g, "_")
		.replace(/^_|_$/g, "");

	// Если имя стало пустым, используем fallback
	return cleanName || "file";
}

// Тесты
console.log("=== ТЕСТЫ ТРАНСЛИТЕРАЦИИ ===");
console.log("");

const testCases = ["СФГ ТАМІЛА СПЕЦ № 1 від 06.10.2025р. пшен. 85,5 тон.pdf", "Договір підряду.pdf", "Накладна №123 від 15.05.2025.pdf", "test.pdf", "файл з пробілами.pdf"];

testCases.forEach((testCase) => {
	console.log(`Оригинал: ${testCase}`);
	console.log(`Результат: ${createSafeFileName(testCase)}`);
	console.log("");
});

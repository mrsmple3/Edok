<template>
  <Dialog v-model:open="isDialogOpen">
    <DialogTrigger>
      Подписать документ
    </DialogTrigger>
    <DialogContent>
      <DialogHeader>
        <DialogTitle>Электронная подпись</DialogTitle>
        <DialogDescription>Выберите тип подписи и подпишите документ</DialogDescription>
      </DialogHeader>
      <div class="">
        <div id="sign-widget-parent">
          <!-- <iframe src="https://id.gov.ua/sign-widget/v20220527/" id="sign-widget"></iframe> -->
        </div>
      </div>
      <DialogFooter>
        <Button @click="signDocument">Подписать</Button>
        <Button variant="outline" @click="isDialogOpen = false">Отмена</Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
</template>

<script setup lang="ts">
import { ref } from "vue";
import { useToast } from "~/components/ui/toast";

const isDialogOpen = ref(false);
const signatureType = ref("file");
const selectedFile = ref<File | null>(null);

// onMounted(() => {
//   if (window.EndUser) {
//     const euSign = new window.EndUser(
//       "sign-widget-parent",
//       "sign-widget",
//       "https://id.gov.ua/sign-widget/v20220527/",
//       window.EndUser.FormType.SignFile
//     );
//     // инициализация или вызов методов
//   } else {
//     console.error("EndUser не загружен");
//   }
// });


watch(isDialogOpen, async (newVal) => {
  if (newVal) {
    await nextTick(); // дождаться отрисовки DOM внутри диалога

    const parent = document.getElementById("sign-widget-parent");
    if (!parent) {
      console.error("sign-widget-parent не найден");
      return;
    }

    if (window.EndUser) {
      const euSign = new window.EndUser(
        "sign-widget-parent",
        "sign-widget",
        "https://id.gov.ua/sign-widget/v20220527/",
        window.EndUser.FormType.SignFile
      );
      // Можно сохранить euSign в ref, если он понадобится позже
    } else {
      console.error("EndUser не загружен");
    }
  }
});

const signDocument = async () => {
  const { toast } = useToast();

  try {
    if (!selectedFile.value) {
      toast({
        title: "Ошибка",
        description: "Выберите файл для подписи",
        variant: "destructive",
      });
      return;
    }

    // Логика для наложения подписи
    if (signatureType.value === "file") {
      // Используем файловый ключ
      console.log("Подписываем с использованием файлового ключа");
      // Вызов API или библиотеки для подписи
    } else if (signatureType.value === "hardware") {
      // Используем аппаратный носитель
      console.log("Подписываем с использованием аппаратного носителя");
      // Вызов API или библиотеки для подписи
    } else if (signatureType.value === "cloud") {
      // Используем облачную подпись
      console.log("Подписываем с использованием облачной подписи");
      // Вызов API или библиотеки для подписи
    }

    toast({
      title: "Успех",
      description: "Документ успешно подписан",
    });
    isDialogOpen.value = false; // Закрываем диалоговое окно
  } catch (error) {
    console.error("Ошибка при подписании документа:", error);
    toast({
      title: "Ошибка",
      description: "Не удалось подписать документ",
      variant: "destructive",
    });
  }
};
</script>

<style lang="scss"></style>

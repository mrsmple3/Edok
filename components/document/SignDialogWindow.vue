<template>
  <Dialog v-model:open="isDialogOpen">
    <DialogTrigger>
      Подписать документ
    </DialogTrigger>
    <DialogContent class="!max-w-[80vw] !w-[80vw] h-[80vh]">
      <DialogHeader>
        <DialogTitle>Электронная подпись</DialogTitle>
        <DialogDescription>Выберите тип подписи и подпишите документ</DialogDescription>
      </DialogHeader>
      <div class="">
        <div id="sign-widget-parent">
        </div>
      </div>
      <DialogFooter class="mt-auto">
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


watch(isDialogOpen, async (newVal) => {
  if (newVal) {
    await nextTick(); // дождаться отрисовки DOM внутри диалога

    const parent = document.getElementById("sign-widget-parent");
    if (!parent) {
      console.error("sign-widget-parent не найден");
      return;
    }

    if (typeof EndUser !== "undefined") {
      const euSign = new EndUser(
        "sign-widget-parent",
        "sign-widget",
        "https://test.id.gov.ua/sign-widget/v2022testnew/",
        EndUser.FormType.SignFile
      );
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

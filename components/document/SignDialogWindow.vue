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
      <div id="sign-widget-parent" class="w-full h-[600px]">
      </div>
      <div class="upload-signed-document">
        <div
          class="upload-signed-document border border-dashed border-gray-400 rounded p-4 flex flex-col items-center justify-center cursor-pointer"
          @dragover.prevent @drop.prevent="handleDrop" @click="fileInputRef.click()">
          <input type="file" ref="fileInputRef" class="hidden" @change="handleFileChange" accept=".pdf,.sig" />
          <span class="text-gray-500">Перетащите файл сюда или кликните для выбора</span>
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
import { useUserStore } from "~/store/user.store";

const isDialogOpen = ref(false);
const { toast } = useToast();
const route = useRoute();
const userStore = useUserStore();

const fileInputRef = ref<HTMLInputElement | null>(null);

function handleDrop(event: DragEvent) {
  const files = event.dataTransfer?.files;
  if (files && files.length > 0) {
    // обработка файла
    // emit или set file
  }
}

function handleFileChange(event: Event) {
  const files = (event.target as HTMLInputElement).files;
  if (files && files.length > 0) {
    // обработка файла
    // emit или set file
  }
}

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

    window.addEventListener("message", (event) => {
      // проверка источника
      if (event.origin !== "https://id.gov.ua") return;

      const data = event.data;
      console.log("Сообщение от iframe:", data);

      if (data?.type === "sign-complete") {
        // примерное значение type, может отличаться — нужно проверить в реальном сообщении
        console.log("Подпись завершена");
      }
    });
  }
});

async function signDocument() {
  try {
    // TODO: Можно сделать так чтобы загружать тот документ который подписан уже и вот тогда только можно будет нажать на кнопку подписать
    isDialogOpen.value = false;

  } catch (error: any) {
    console.error(error);
    toast({ title: "Ошибка", description: error.message || "Не удалось подписать", variant: "destructive" });
  }
}
</script>

<style lang="scss"></style>

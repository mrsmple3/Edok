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
      <div id="sign-widget-parent" class="w-full h-[500px]">
      </div>
      <div class="upload-signed-document">
        <div
          class="upload-signed-document border border-dashed border-gray-400 rounded p-4 flex flex-col items-center justify-center cursor-pointer"
          @dragover.prevent @drop.prevent="handleDrop" @click="fileInputRef.click()">
          <input type="file" ref="fileInputRef" class="hidden" @change="handleFileChange" accept=".pdf,.sig" />
          <span class="text-gray-500" v-if="selectedFile === null">Перетащите подписанный файл сюда или кликните для
            выбора</span>
          <span class="text-gray-500" v-else>{{ selectedFile.name }}</span>
        </div>
      </div>
      <DialogFooter class="mt-auto">
        <Button variant="outline" @click="isDialogOpen = false">Отмена</Button>
        <Button @click="signDocument"
          :class="{ 'pointer-events-none opacity-70': selectedFile === null }">Подписать</Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
</template>

<script setup lang="ts">
import { ref } from "vue";
import { useToast } from "~/components/ui/toast";
import { useAdminStore } from "~/store/admin.store";
import { useUserStore } from "~/store/user.store";

const adminStore = useAdminStore();
const isDialogOpen = ref(false);
const { toast } = useToast();
const route = useRoute();
const router = useRouter();
const userStore = useUserStore();

const selectedFile = ref<File | null>(null);
const fileInputRef = ref<HTMLInputElement>();

function handleDrop(event: DragEvent) {
  const files = event.dataTransfer?.files;
  if (files && files.length > 0) {
    selectedFile.value = files[0];
  }
}

function handleFileChange(event: Event) {
  const files = (event.target as HTMLInputElement).files;
  if (files && files.length > 0) {
    selectedFile.value = files[0];
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
    const currentDocument = adminStore.getDocumentById(Number(route.query.documentSign))
    if (selectedFile === null) {
      toast({ title: "Ошибка", description: "Не был загружен подписанный файл", variant: "destructive" });
      return;
    }

    await adminStore
      .updateDocument({
        id: currentDocument.id,
        status: 'Подписан',
      })

    const document = await adminStore.createDocument(
      {
        title: selectedFile.value.name,
        userId: userStore.userGetter.id,
        counterpartyId: adminStore.getDocumentById(Number(route.query.documentSign)).counterpartyId,
        type: 'Подписанный',
        content: adminStore.getDocumentById(Number(route.query.documentSign)).content,
        leadId: adminStore.getDocumentById(Number(route.query.documentSign)).leadId,
        status: 'Подписан',
      },
      selectedFile.value
    );

    isDialogOpen.value = false;

  } catch (error: any) {
    console.error(error);
    toast({ title: "Ошибка", description: error.message || "Не удалось подписать", variant: "destructive" });
  }
}
</script>

<style lang="scss"></style>

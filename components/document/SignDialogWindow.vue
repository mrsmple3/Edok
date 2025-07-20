<template>
  <Dialog v-model:open="isDialogOpen">
    <DialogTrigger>
      Підписати документ
    </DialogTrigger>
    <DialogContent class="!max-w-[98vw] !w-[98vw] h-[98vh]">
      <DialogHeader class="h-max">
        <DialogTitle>Електронний підпис</DialogTitle>
        <DialogDescription>
          Завантажте ключ, введіть пароль та виберіть файл для підпису
        </DialogDescription>
      </DialogHeader>

      <div id="sign-widget-parent" class="w-full h-[800px]">
      </div>

      <DialogFooter class="mt-auto">
        <Button @click="signDocument">Підписати</Button>
        <Button variant="outline" @click="isDialogOpen = false">Скасувати</Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
</template>

<script setup lang="ts">
import { useToast } from "~/components/ui/toast";
import { useAdminStore } from "~/store/admin.store";
import { useUserStore } from "~/store/user.store";
import { addVisibleStamp } from "~/server/utils/addVisibleStamp"

const adminStore = useAdminStore();
const route = useRoute();
const router = useRouter();
const userStore = useUserStore();
const isDialogOpen = ref(false);
const { toast } = useToast();
const euSign = ref(null);

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
    await nextTick();

    if (typeof EndUser !== "undefined") {
      euSign.value = new EndUser(
        "sign-widget-parent",
        "sign-widget",
        "https://id.gov.ua/sign-widget/v20220527/",
        EndUser.FormType.ReadPKey
      );
    } else {
      console.error("EndUser не загружен");
    }
  }
});

const controlFlag = ref(true);


async function signDocument() {
  try {
    const filePath = adminStore.getDocumentById(parseInt(route.query.documentSign))?.filePath;
    if (!filePath) {
      toast({
        title: "Ошибка",
        description: 'Файл для подписи не найден',
        variant: "destructive",
      });
      return;
    };

    const file = await fetchFile(filePath);
    const reader = new FileReader();

    controlFlag.value = false;

    reader.onload = async () => {
      const binary = new Uint8Array(reader.result as ArrayBuffer);
      const base64data = btoa(
        binary.reduce((acc, byte) => acc + String.fromCharCode(byte), "")
      );

      // 3. Считать ключ (вызовет диалог с iframe, если еще не был считан)
      await euSign.value.ReadPrivateKey();

      // 4. Подписать
      const external = false;
      const asBase64String = true;
      const signAlgo = EndUser.SignAlgo.DSTU4145WithGOST34311;
      const signType = EndUser.SignType.CAdES_X_Long_Trusted;


      const signedPdfBase64 = await euSign.value.PAdESSignData(
        binary,
        true,  // asBase64String
        EndUser.SignAlgo.DSTU4145WithGOST34311,
        EndUser.PAdESSignLevel.PAdES_B_T
      );

      // 3. Конвертировать подписанный документ из Base64 в ArrayBuffer
      const signedPdfBlob = base64ToBlob(signedPdfBase64, "application/pdf");
      const signedPdfArrayBuffer = await signedPdfBlob.arrayBuffer();

      // 4. Добавить видимую печать
      const stampPath = userStore.userRole !== 'counterparty' ? '/images/stamp.png' : '/images/stamp-c.png'; // Путь к изображению печати
      const finalPdfBytes = await addVisibleStamp(signedPdfArrayBuffer, stampPath);

      // 5. Создать финальный PDF-файл с печатью
      const finalPdfBlob = new Blob([finalPdfBytes], { type: "application/pdf" });
      const finalPdfFile = new File([finalPdfBlob], `${file.name}_signed.pdf`, { type: "application/pdf" });

      // Создать ссылку для скачивания
      const downloadLink = document.createElement("a");
      downloadLink.href = URL.createObjectURL(finalPdfBlob);
      downloadLink.download = `${file.name}_signed.pdf`;
      downloadLink.click();
      URL.revokeObjectURL(downloadLink.href);


      const sign = await euSign.value.SignData(
        base64data,
        external,
        asBase64String,
        signAlgo,
        null,
        signType
      );

      const blob = base64ToBlob(sign, "application/pkcs7-signature");
      const signedFile = new File([blob], `${file.name}.p7s`, { type: "application/pkcs7-signature" });
      console.log(signedFile);


      await adminStore.createSign(
        parseInt(route.query.documentSign),
        userStore.userGetter.id,
        signedFile,
        finalPdfFile
      ).then(() => {
        isDialogOpen.value = false;
      });
    };

    reader.readAsArrayBuffer(file);
    toast({
      title: "Успіх",
      description: "Документ успішно підписано",
      variant: "default",
    });
    controlFlag.value = true;
  } catch (e: any) {
    toast({
      title: "Ошибка",
      description: e?.message || e,
      variant: "destructive",
    });
  }
}

function base64ToBlob(base64: string, mime: string) {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return new Blob([bytes], { type: mime });
}

async function fetchFile(filePath: string) {
  try {
    const response = await fetch(filePath);
    if (!response.ok) throw new Error('Не удалось загрузить файл');
    const blob = await response.blob();

    const fileName = filePath.split('/').pop() || 'document.pdf';

    const file = new File([blob], fileName, { type: blob.type });

    return file;
  } catch (e) {
    console.error('Ошибка загрузки файла:', e);
  }
}
</script>

<style lang="scss"></style>

<template>
  <Dialog v-model:open="isDialogOpen">
    <DialogTrigger>
      Подписать документ
    </DialogTrigger>
    <DialogContent class="!max-w-[80vw] !w-[80vw] h-[75vh]">
      <DialogHeader>
        <DialogTitle>Электронная подпись</DialogTitle>
        <DialogDescription>
          Загрузите ключ, введите пароль и выберите файл для подписи
        </DialogDescription>
      </DialogHeader>

      <div id="sign-widget-parent" class="w-full h-[450px]">
      </div>

      <!-- <div class="upload-signed-document">
        <div
          class="upload-signed-document border border-dashed border-gray-400 rounded p-4 flex flex-col items-center justify-center cursor-pointer"
          @dragover.prevent @drop.prevent="handleDrop" @click="fileInputRef.click()">
          <input type="file" ref="fileInputRef" class="hidden" @change="handleFileChange" accept=".pdf,.sig" />
          <span class="text-gray-500" v-if="selectedFile === null">Перетащите подписанный файл сюда или кликните для
            выбора</span>
          <span class="text-gray-500" v-else>{{ selectedFile.name }}</span>
        </div>
      </div> -->

      <DialogFooter class="mt-auto">
        <Button @click="signDocument">Подписать</Button>
        <Button variant="outline" @click="isDialogOpen = false">Отмена</Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
</template>

<script setup lang="ts">
import { useToast } from "~/components/ui/toast";
import { useAdminStore } from "~/store/admin.store";
import { useUserStore } from "~/store/user.store";

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
      const formParams = new EndUser.FormParams();
      formParams.showPKInfo = true;
      formParams.showSignTip = true;
      formParams.language = 'ua';

      euSign.value = new EndUser(
        "sign-widget-parent",
        "sign-widget",
        "https://id.gov.ua/sign-widget/v20220527/",
        EndUser.FormType.ReadPKey,
        formParams
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


      const signPdf = await euSign.value.PAdESSignData(
        binary,            // Uint8Array PDF файла
        true,              // asBase64String
        EndUser.SignAlgo.DSTU4145WithGOST34311,
        EndUser.PAdESSignLevel.PAdES_B_T,
        {
          // Параметры видимой подписи
          addVisibleSign: true,
          signInfo: {
            reason: "Підпис документа",
            location: "Україна",
            contact: "info@agroedoc.com"
          },
          // Позиция подписи на странице
          signPosition: {
            page: 1,        // Номер страницы (начиная с 1)
            x: 50,          // X координата
            y: 50,          // Y координата
            width: 200,     // Ширина подписи
            height: 100     // Высота подписи
          },
          // Добавление изображения печати
          signImage: {
            imageData: "base64_encoded_image_data", // Base64 изображения печати
            imageType: "PNG" // или "JPEG"
          }
        }
      );

      console.log(signPdf);

      // Скачать подписанный PDF
      const pdfBlob = base64ToBlob(signPdf, "application/pdf");
      const pdfFile = new File([pdfBlob], `${file.name}_signed.pdf`, { type: "application/pdf" });

      // Создать ссылку для скачивания
      const downloadLink = document.createElement("a");
      downloadLink.href = URL.createObjectURL(pdfBlob);
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

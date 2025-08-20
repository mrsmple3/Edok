<template>
  <Dialog v-model:open="isDialogOpen" :class="{ 'pointer-events-none ': isLoading }">
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

      <div class="iframe-sign">
        <div id="sign-widget-parent" class="h-full w-full min-w-[1368px]">
        </div>
      </div>

      <DialogFooter class="mt-auto">
        <Button @click="signDocument" :disabled="isLoading">
          <Loader2 v-if="isLoading" class="mr-2 h-4 w-4 animate-spin" />
          {{ isLoading ? 'Підписання...' : 'Підписати' }}
        </Button>
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
import { Loader2 } from "lucide-vue-next"

const adminStore = useAdminStore();
const route = useRoute();
const router = useRouter();
const userStore = useUserStore();
const isDialogOpen = ref(false);
const { toast } = useToast();
const euSign = ref(null);

const isLoading = ref(false);

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
  if (isLoading.value) return;

  isLoading.value = true;

  const currentDoc = adminStore.getDocumentById(parseInt(route.query.documentSign));

  try {
    const filePath = currentDoc.Signature.length !== 0 ? currentDoc.Signature[currentDoc.Signature.length - 1].stampedFile : currentDoc?.filePath;
    console.log(filePath);
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
      // Получаем ArrayBuffer напрямую из файла (без PAdES подписи)
      const originalArrayBuffer = reader.result as ArrayBuffer;
      const binary = new Uint8Array(reader.result as ArrayBuffer);
      const base64data = arrayBufferToBase64(binary);

      // 3. Считать ключ (вызовет диалог с iframe, если еще не был считан)
      await euSign.value.ReadPrivateKey();

      // 4. Подписать
      const external = false;
      const asBase64String = true;
      const signAlgo = EndUser.SignAlgo.DSTU4145WithGOST34311;
      const signType = EndUser.SignType.CAdES_X_Long_Trusted;

      // 4. Добавить видимую печать
      const stampData = {
        organizationName: userStore.userGetter.organization_name,
        signerINN: userStore.userGetter.organization_INN,
      };
      const finalPdfBytes = await addVisibleStamp(originalArrayBuffer, stampData);

      // 5. Создать финальный PDF-файл с печатью
      const finalPdfBlob = new Blob([finalPdfBytes], { type: "application/pdf" });
      const finalPdfFile = new File([finalPdfBlob], `${file.name}`, { type: "application/pdf" });

      // Создать ссылку для скачивания
      const downloadLink = document.createElement("a");
      downloadLink.href = URL.createObjectURL(finalPdfBlob);
      downloadLink.download = `${file.name}`;
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
      const signedFile = new File([blob], `${file.name}`, { type: "application/pkcs7-signature" });


      await adminStore.createSign(
        parseInt(route.query.documentSign),
        userStore.userGetter.id,
        signedFile,
        finalPdfFile
      ).then(() => {
        toast({
          title: "Успіх",
          description: "Документ успішно підписано. Зачекайте, поки вікно закриється.",
          variant: "default",
        });
        isDialogOpen.value = false;
        setTimeout(() => {
          window.location.reload();
        }, 800);
      });
    };

    reader.readAsArrayBuffer(file);

    // controlFlag.value = true;
  } catch (e: any) {
    toast({
      title: "Ошибка",
      description: e?.message || e,
      variant: "destructive",
    });
  } finally {
    isLoading.value = false;
  }
}


function arrayBufferToBase64(buffer: Uint8Array): string {
  let binary = '';
  const len = buffer.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(buffer[i]);
  }
  return btoa(binary);
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

<style lang="scss">
.iframe-sign {
  display: flex;
  justify-content: flex-start;
  align-items: start;
  width: 100%;
  height: calc(26.6666666667 * (1vw + 1vh));
  overflow: auto;
}
</style>

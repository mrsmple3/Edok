<template>
  <Dialog v-model:open="isDialogOpen" :class="{ 'pointer-events-none ': isLoading }">
    <DialogTrigger :class="triggerClass" :disabled="isTriggerDisabled">
      <slot name="trigger" :disabled="isTriggerDisabled">
        {{ triggerLabel }}
      </slot>
    </DialogTrigger>
    <DialogContent class="!max-w-[98vw] !w-[98vw] h-[98vh]">
      <DialogHeader class="h-max">
        <DialogTitle>Електронний підпис</DialogTitle>
        <DialogDescription>
          Завантажте ключ, введіть пароль та виберіть файл для підпису
        </DialogDescription>
      </DialogHeader>

      <div v-if="documentsSummary.length" class="mb-4 rounded-md bg-[#f5f5f5] p-4 text-sm text-[#4b5563]">
        <p class="font-semibold text-[#1f2937]">
          Документ {{ currentDocumentPosition }} з {{ documentsSummary.length }}
        </p>
        <p class="truncate text-[#111827]">
          {{ currentDocumentTitle }}
        </p>
      </div>

      <div class="sign-key">
        <div class="sign-tabs">
          <button class="sign-tab sign-tab-active" type="button">Файловий</button>
          <button class="sign-tab sign-tab-disabled" type="button" disabled>Токен</button>
          <button class="sign-tab sign-tab-disabled" type="button" disabled>Хмарний</button>
        </div>

        <div class="sign-provider">
          <div class="sign-provider-label">
            Кваліфікований надавач електронних довірчих послуг
          </div>
          <select class="sign-provider-select" v-model="providerMode">
            <option value="auto">Визначити автоматично</option>
            <option value="uakey">ЦСК Україна (UAKey)</option>
          </select>
        </div>

        <div
          class="sign-dropzone"
          @dragover.prevent
          @drop.prevent="handleKeyDrop"
          @click="keyInputRef?.click()"
        >
          <input
            ref="keyInputRef"
            type="file"
            class="hidden"
            accept=".pfx,.pk8,.zs2,.jks,.dat"
            @change="handleKeyFileChange"
          />
          <div v-if="!keyFile" class="sign-dropzone-text">
            <div class="sign-dropzone-title">
              Перетягніть сюди файл ключа
              або <span class="sign-dropzone-link">завантажте його зі свого носія</span>
            </div>
            <div class="sign-dropzone-hint">
              (зазвичай його назва "Key-6.dat" або *.pfx, *.pk8, *.zs2, *.jks)
            </div>
          </div>
          <div v-else class="sign-dropzone-file">
            <div class="sign-dropzone-file-name">{{ keyFile.name }}</div>
            <div class="sign-dropzone-file-size">{{ formatFileSize(keyFile.size) }}</div>
          </div>
        </div>

        <div class="sign-password">
          <input
            v-model="keyPassword"
            type="password"
            class="sign-password-input"
            placeholder="Пароль захисту ключа"
            autocomplete="current-password"
          />
        </div>

        <div class="sign-read-actions">
          <Button
            @click="handleReadPrivateKey"
            :disabled="!canReadKey || isKeyReading || isLoading"
          >
            <Loader2 v-if="isKeyReading" class="mr-2 h-4 w-4 animate-spin" />
            {{ isKeyReading ? "Зчитуємо..." : "Зчитати" }}
          </Button>
          <div v-if="keyReadStatus" class="sign-read-status">
            {{ keyReadStatus }}
          </div>
        </div>
      </div>

      <DialogFooter class="dialog-footer">
        <Button @click="signDocument" :disabled="isLoading || !hasLoadedPrivateKey">
          <Loader2 v-if="isLoading" class="mr-2 h-4 w-4 animate-spin" />
          {{ isLoading ? 'Підписання...' : 'Підписати' }}
        </Button>
        <Button variant="outline" @click="isDialogOpen = false">Назад</Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
</template>

<script setup lang="ts">
import type { PropType } from "vue";
import { useToast } from "~/components/ui/toast";
import { useAdminStore } from "~/store/admin.store";
import { useUserStore } from "~/store/user.store";
import { Loader2 } from "lucide-vue-next";
import { documentRequiresCounterpartySignature, documentRequiresSignature } from "~/lib/documents";

const props = defineProps({
  documents: {
    type: Array as PropType<Array<number | { id: number }>>,
    default: () => [],
  },
  triggerLabel: {
    type: String,
    default: "Підписати документ",
  },
  triggerClass: {
    type: String,
    default: "",
  },
  disabled: {
    type: Boolean,
    default: false,
  },
});

const adminStore = useAdminStore();
const route = useRoute();
const userStore = useUserStore();
const isDialogOpen = ref(false);
const { toast } = useToast();
const euSign = ref<any>(null);

const isLoading = ref(false);
const isKeyReading = ref(false);
const keyReadStatus = ref("");
const MAX_SIGNATURES_PER_ORG = 2;

const signQueue = ref<number[]>([]);
const currentDocumentIndex = ref(0);
const hasLoadedPrivateKey = ref(false);
const keyFile = ref<File | null>(null);
const keyPassword = ref("");
const providerMode = ref("auto");
const keyInputRef = ref<HTMLInputElement | null>(null);
const tslLoaded = ref(false);

const queueDocuments = computed(() => {
  if (props.documents?.length) {
    return props.documents
      .map((doc: any) => Number(typeof doc === "object" ? doc?.id : doc))
      .filter((id) => Number.isInteger(id) && id > 0);
  }

  const documentId = route.query.documentSign ? parseInt(route.query.documentSign as string, 10) : NaN;
  return Number.isNaN(documentId) ? [] : [documentId];
});

const documentsSummary = computed(() => {
  return signQueue.value
    .map((id) => adminStore.getDocumentById(id))
    .filter((doc): doc is NonNullable<typeof doc> => Boolean(doc));
});

const currentDocument = computed(() => {
  const docId = signQueue.value[currentDocumentIndex.value];
  if (!docId) return null;
  return adminStore.getDocumentById(docId) || null;
});

const currentDocumentTitle = computed(() => {
  if (!currentDocument.value) {
    return "";
  }
  return currentDocument.value.title || `Документ #${currentDocument.value.id}`;
});

const currentDocumentPosition = computed(() => {
  return Math.min(currentDocumentIndex.value + 1, Math.max(signQueue.value.length, 1));
});

const isTriggerDisabled = computed(() => props.disabled || isLoading.value);
const canReadKey = computed(() => Boolean(keyFile.value) && Boolean(keyPassword.value));

watch(isDialogOpen, async (newVal) => {
  if (newVal) {
    signQueue.value = [...queueDocuments.value];
    currentDocumentIndex.value = 0;
    hasLoadedPrivateKey.value = false;
    keyReadStatus.value = "";

    if (!signQueue.value.length) {
      toast({
        title: "Помилка",
        description: "Оберіть хоча б один документ для підпису",
        variant: "destructive",
      });
      isDialogOpen.value = false;
      return;
    }

    await nextTick();
    try {
      await initEUSign();
    } catch (error: any) {
      console.error("EUSignCP init error:", error);
      toast({
        title: "Помилка",
        description: "Модуль підпису не завантажено. Спробуйте ще раз.",
        variant: "destructive",
      });
      isDialogOpen.value = false;
    }
  } else {
    signQueue.value = [];
    resetKeyState();
  }
});

async function signDocument() {
  if (isLoading.value) return;

  if (!signQueue.value.length) {
    toast({
      title: "Помилка",
      description: "Оберіть хоча б один документ для підпису",
      variant: "destructive",
    });
    return;
  }

  console.log("🚀 Починаємо процес підписання документів", signQueue.value);
  isLoading.value = true;

  let signedDocuments = 0;

  try {
    for (let index = 0; index < signQueue.value.length; index++) {
      currentDocumentIndex.value = index;
      const docId = signQueue.value[index];
      await processDocument(docId);
      signedDocuments += 1;
    }

    toast({
      title: "Успіх",
      description:
        signedDocuments > 1
          ? `Документи (${signedDocuments}) успішно підписано. Зачекайте, поки вікно закриється.`
          : "Документ успішно підписано. Зачекайте, поки вікно закриється.",
      variant: "default",
    });

    isDialogOpen.value = false;
    setTimeout(() => {
      window.location.reload();
    }, 800);
  } catch (e: any) {
    console.error("❌ Помилка в процесі підписання:", e);
    console.error("Деталі помилки:", {
      message: e?.message,
      stack: e?.stack,
      name: e?.name,
    });

    toast({
      title: "Помилка",
      description: e?.message || e,
      variant: "destructive",
    });
  } finally {
    console.log("🏁 Завершення процесу підписання, isLoading = false");
    isLoading.value = false;
  }
}

async function processDocument(docId: number) {
  const currentDoc = adminStore.getDocumentById(docId);

  if (!currentDoc) {
    throw new Error("Документ не знайдено");
  }

  if (!documentRequiresSignature(currentDoc.type)) {
    throw new Error("Цей документ не потребує підпису");
  }

  if (documentRequiresCounterpartySignature(currentDoc.type)) {
    if (userStore.userRole !== "counterparty" || currentDoc.counterpartyId !== userStore.userGetter.id) {
      throw new Error("Цей документ може підписувати лише контрагент.");
    }
  }

  const filePath =
    currentDoc.Signature?.length && currentDoc.Signature[currentDoc.Signature.length - 1]?.stampedFile
      ? currentDoc.Signature[currentDoc.Signature.length - 1].stampedFile
      : currentDoc.filePath;

  if (!filePath) {
    throw new Error("Файл для підпису не знайдено");
  }

  const file = await fetchFile(filePath);

  if (!file) {
    throw new Error("Не вдалося завантажити файл для підпису");
  }

  const originalArrayBuffer = await readFileAsArrayBuffer(file);
  await ensurePrivateKeyLoaded();

  const binary = new Uint8Array(originalArrayBuffer);
  const sign = await euSign.value.SignData(binary, true);

  const blob = base64ToBlob(sign, "application/pkcs7-signature");
  const signedFile = new File([blob], `${file.name}`, { type: "application/pkcs7-signature" });

  const finalPdfBlob = new Blob([originalArrayBuffer], { type: "application/pdf" });
  const finalPdfFile = new File([finalPdfBlob], `${file.name}`, { type: "application/pdf" });

  const { certInfo, stampData } = await extractCertificateData(signedFile, currentDoc);

  validateFilesBeforeUpload(signedFile, finalPdfFile);

  await persistSignature(currentDoc.id, signedFile, finalPdfFile, certInfo, stampData);
}

async function ensurePrivateKeyLoaded() {
  if (!euSign.value) {
    throw new Error("Модуль підпису не ініціалізовано");
  }

  if (!hasLoadedPrivateKey.value) {
    if (!keyFile.value || !keyPassword.value) {
      throw new Error("Спочатку завантажте ключ і введіть пароль");
    }
    await readPrivateKey();
  }
}

async function extractCertificateData(signedFile: File, currentDoc: any) {
  let certInfo: any = null;
  let stampData = {
    organizationName: "",
    signerINN: "",
    signerName: "",
    signerPosition: "",
    stampCount: currentDoc.Signature?.length || 0,
  };

  try {
    const tempFormData = new FormData();
    tempFormData.append("signature", signedFile);

    const certInfoResponse = await $fetch("/api/sign/extractCertInfo", {
      method: "POST",
      body: tempFormData,
    });

    if (certInfoResponse.code === 200) {
      certInfo = certInfoResponse.body.certInfo;
      console.log("Извлеченная информация о сертификате:", certInfo);

      const parsedCertData = parseCertificateInfo(certInfo);
      const currentOrgName = parsedCertData.organizationName || parsedCertData.fullName || "";
      const normalizedCurrentOrgName = normalizeOrganizationName(currentOrgName);

      const existingOrgCounts = getOrganizationSignCounts(currentDoc?.Signature || []);
      const existingOrgSignCount = normalizedCurrentOrgName ? existingOrgCounts.get(normalizedCurrentOrgName) || 0 : 0;

      if (normalizedCurrentOrgName && existingOrgSignCount >= MAX_SIGNATURES_PER_ORG) {
        throw new Error(`Організація "${currentOrgName}" вже підписувала цей документ ${MAX_SIGNATURES_PER_ORG} рази.`);
      }

      stampData = {
        organizationName: parsedCertData.organizationName || "",
        signerINN: parsedCertData.inn || "",
        signerName: parsedCertData.fullName || "",
        signerPosition: parsedCertData.position || "",
        stampCount: currentDoc.Signature?.length || 0,
      };
    }
  } catch (certError: any) {
    if (certError instanceof Error && certError.message?.includes("Організація")) {
      throw certError;
    }
    console.error("Ошибка извлечения информации о сертификате:", certError);
  }

  return { certInfo, stampData };
}

function validateFilesBeforeUpload(signedFile: File, finalPdfFile: File) {
  if (!signedFile.size || !finalPdfFile.size) {
    throw new Error("Ошибка: размер одного из файлов равен 0");
  }

  if (signedFile.size < 100) {
    throw new Error("Ошибка: размер подписи слишком мал");
  }

  if (finalPdfFile.size < 1000) {
    throw new Error("Ошибка: размер PDF файла слишком мал");
  }

  console.log("✅ Файли пройшли валідацію, відправляємо на сервер...");
}

async function persistSignature(
  documentId: number,
  signedFile: File,
  finalPdfFile: File,
  certInfo: any,
  stampData: any
) {
  const result = await adminStore.createSign(
    documentId,
    userStore.userGetter.id,
    signedFile,
    finalPdfFile,
    certInfo,
    stampData
  );

  console.log("✅ Підпис створено", result);

  const verificationPromises: Promise<any>[] = [];

  if (result?.signature) {
    verificationPromises.push(
      fetch(result.signature, { method: "HEAD" })
        .then((response) => ({
          type: "signature",
          exists: response.ok,
          url: result.signature,
          status: response.status,
        }))
        .catch((error) => ({
          type: "signature",
          exists: false,
          url: result.signature,
          error: error.message,
        }))
    );
  }

  if (result?.stampedFile) {
    verificationPromises.push(
      fetch(result.stampedFile, { method: "HEAD" })
        .then((response) => ({
          type: "stampedFile",
          exists: response.ok,
          url: result.stampedFile,
          status: response.status,
        }))
        .catch((error) => ({
          type: "stampedFile",
          exists: false,
          url: result.stampedFile,
          error: error.message,
        }))
    );
  }

  if (verificationPromises.length) {
    const verificationResults = await Promise.all(verificationPromises);
    const missingFiles = verificationResults.filter((result) => !result.exists);

    if (missingFiles.length > 0) {
      console.error("❌ Деякі файли підпису недоступні:", missingFiles);

      try {
        await adminStore.deleteSignature(result.id);
        console.log("🗑️ Підпис видалено через проблеми зі збереженням файлів");
      } catch (deleteError) {
        console.error("❌ Помилка при видаленні підпису:", deleteError);
      }

      throw new Error("Файли підпису не були збережені коректно. Підпис скасовано. Спробуйте ще раз.");
    }

    console.log("✅ Всі файли підпису доступні", verificationResults);
  }
}

async function readFileAsArrayBuffer(file: File) {
  return await new Promise<ArrayBuffer>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as ArrayBuffer);
    reader.onerror = () => reject(reader.error);
    reader.readAsArrayBuffer(file);
  });
}

// Функция для парсинга информации из сертификата
function parseCertificateInfo(certInfo: any) {
  const result = {
    fullName: '',
    inn: '',
    organizationName: '',
    position: 'не видан'
  };

  try {
    if (!certInfo || typeof certInfo !== 'string') {
      console.log('certInfo пустой или не строка:', certInfo);
      return result;
    }

    const subjectMatch = certInfo.match(/Subject: (.+?)(?:\n|$)/s);
    if (subjectMatch) {
      const subject = subjectMatch[1];
      console.log('Subject владельца:', subject);

      const cnMatch = subject.match(/CN=([^,\n]+)/);
      if (cnMatch) {
        result.fullName = decodeHexString(cnMatch[1]).trim();
        result.organizationName = result.fullName;
      }

      const subjectSerialMatch = subject.match(/serialNumber=(\d+)/);
      if (subjectSerialMatch) {
        result.inn = subjectSerialMatch[1];
        console.log('INN найден в Subject serialNumber:', result.inn);
      }

      if (!result.inn) {
        const innMatch = subject.match(/serialNumber=TINUA-(\d+)/);
        if (innMatch) {
          result.inn = innMatch[1];
          console.log('INN найден в TINUA формате:', result.inn);
        }
      }

      if (!result.inn) {
        const uidMatch = subject.match(/UID=(\d+)/);
        if (uidMatch) {
          result.inn = uidMatch[1];
          console.log('INN найден в UID:', result.inn);
        }
      }

      const titleMatch = subject.match(/title=([^,\n]+)/i) || subject.match(/T=([^,\n]+)/i);
      if (titleMatch) {
        const titleValue = decodeHexString(titleMatch[1]).trim();
        result.position = titleValue;
        console.log('Позиция найдена в title:', titleValue);
      } else {
        const stMatch = subject.match(/ST=([^,\n]+)/i);
        if (stMatch) {
          result.position = decodeHexString(stMatch[1]).trim();
          console.log('Позиция взята из ST (область):', result.position);
        }
      }

      if (!result.position || result.position === 'не видан') {
        const ouMatch = subject.match(/OU=([^,\n]+)/i);
        if (ouMatch) {
          const ouVal = decodeHexString(ouMatch[1]).trim();
          if (ouVal && ouVal !== "ФІЗИЧНА ОСОБА") {
            result.position = ouVal;
          }
        }
      }

      const directorPatterns = [
        /директор/i,
        /director/i,
        /директ[оуар]/i,
        /дирек[тц]/i,
        /керівник/i,
        /генеральний\s+директор/i,
        /ген\.\s*дир/i,
        /виконавчий\s+директор/i,
        /управляючий/i
      ];

      const isDirector = directorPatterns.some(pattern => {
        const match = subject.match(pattern);
        if (match) {
          console.log(`Найдено совпадение с паттерном директора: "${match[0]}" в Subject`);
          return true;
        }
        return false;
      });

      const cnValue = result.fullName.toLowerCase();
      const titleValue = (titleMatch ? decodeHexString(titleMatch[1]).trim() : '').toLowerCase();

      const isDirectorInFields = directorPatterns.some(pattern => {
        if (pattern.test(cnValue) || pattern.test(titleValue)) {
          console.log(`Найдено совпадение с паттерном директора в полях CN или title`);
          return true;
        }
        return false;
      });

      if (isDirector || isDirectorInFields) {
        result.position = 'Директор';
        console.log('Определена должность: Директор');
      }

      if (result.fullName && (result.fullName.includes('ТОВ') || result.fullName.includes('ООО') || result.fullName.includes('ПП') || result.fullName.includes('ФОП'))) {
        result.organizationName = result.fullName;
      } else {
        const oMatch = subject.match(/O=([^,\n]+)/i);
        if (oMatch) {
          const oVal = decodeHexString(oMatch[1]).trim();
          if (oVal && oVal !== "ФІЗИЧНА ОСОБА") {
            result.organizationName = oVal;
          }
        }
      }
    }

    if (!result.inn) {
      const issuerMatch = certInfo.match(/Issuer: (.+?)(?:\n|$)/s);
      if (issuerMatch) {
        const issuer = issuerMatch[1];
        const issuerSerialMatch = issuer.match(/serialNumber=UA-(\d+)/);
        if (issuerSerialMatch) {
          console.log('Найден INN выдавшей организации, но не владельца');
        }
      }
    }

    if (!result.inn) {
      const subjectDirMatch = certInfo.match(/X509v3 Subject Directory Attributes:\s*[\s\S]*?(\d{8,12})/);
      if (subjectDirMatch) {
        result.inn = subjectDirMatch[1];
        console.log('INN найден в Subject Directory Attributes:', result.inn);
      }
    }

  } catch (error) {
    console.error('Ошибка парсинга сертификата:', error);
  }

  if (!result.fullName) {
    result.fullName = 'Невідомо';
  }
  if (!result.organizationName) {
    result.organizationName = result.fullName;
  }
  if (!result.inn) {
    console.warn('INN не найден в сертификате!');
    result.inn = 'Невідомо';
  }

  console.log('Итоговый результат владельца:', result);
  return result;
}

function decodeHexString(hexStr: string): string {
  try {
    if (!hexStr) return '';

    const cleaned = hexStr.replace(/\\x([0-9A-Fa-f]{2})/g, (match, hex) => {
      return String.fromCharCode(parseInt(hex, 16));
    });

    if (hexStr.includes('\\x')) {
      try {
        const bytes = new Uint8Array([...cleaned].map(char => char.charCodeAt(0)));
        return new TextDecoder('utf-8').decode(bytes);
      } catch (utfError) {
        console.warn('Ошибка декодирования UTF-8, возвращаем как есть:', cleaned);
        return cleaned;
      }
    }

    return cleaned;
  } catch (error) {
    console.error('Ошибка декодирования hex строки:', error);
    return hexStr || '';
  }
}

function getOrganizationSignCounts(signatures: any[]) {
  const counts = new Map<string, number>();
  if (!Array.isArray(signatures)) {
    return counts;
  }

  for (const signature of signatures) {
    if (!signature?.info) continue;
    const parsed = parseCertificateInfo(signature.info);
    const organizationName = parsed.organizationName || parsed.fullName;
    const normalizedName = normalizeOrganizationName(organizationName);

    if (!normalizedName) continue;
    counts.set(normalizedName, (counts.get(normalizedName) || 0) + 1);
  }

  return counts;
}

function normalizeOrganizationName(name?: string) {
  if (!name) return '';
  return name.replace(/\s+/g, ' ').trim().toLowerCase();
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

async function initEUSign() {
  const w = window as any;
  if (!w.__eusignReady) {
    throw new Error("EUSignCP loader not initialized");
  }

  euSign.value = await w.__eusignReady;

  try {
    if (w.FS?.analyzePath && w.FS?.mkdir) {
      const exists = w.FS.analyzePath("/certificates")?.exists;
      if (!exists) {
        w.FS.mkdir("/certificates");
      }
    }

    if (euSign.value.DoesNeedSetSettings && euSign.value.DoesNeedSetSettings()) {
      euSign.value.InitializeMandatorySettings();
    }

    await ensureTSLLoaded();

    if (w.EU_STRING_ENCODING_PARAMETER && w.EU_UTF8_ENCODING) {
      euSign.value.SetRuntimeParameter(w.EU_STRING_ENCODING_PARAMETER, w.EU_UTF8_ENCODING);
    }
    if (w.EU_SIGN_TYPE_PARAMETER && w.EU_SIGN_TYPE_CADES_X_LONG_TRUSTED) {
      euSign.value.SetRuntimeParameter(w.EU_SIGN_TYPE_PARAMETER, w.EU_SIGN_TYPE_CADES_X_LONG_TRUSTED);
    }
    if (w.EU_SIGN_INCLUDE_CA_CERTIFICATES_PARAMETER) {
      euSign.value.SetRuntimeParameter(w.EU_SIGN_INCLUDE_CA_CERTIFICATES_PARAMETER, true);
    }

    if (euSign.value.SetXMLHTTPDirectAccess) {
      euSign.value.SetXMLHTTPDirectAccess(true);
      const hosts = getCmpServers(providerMode.value).map((item) => item.split(":")[0]);
      hosts.forEach((host) => {
        if (euSign.value.AddXMLHTTPDirectAccessAddress) {
          euSign.value.AddXMLHTTPDirectAccessAddress(host);
        }
      });
    }
  } catch (e) {
    console.warn("EUSignCP runtime params warning:", e);
  }
}

async function handleReadPrivateKey() {
  try {
    await readPrivateKey();
  } catch (error: any) {
    toast({
      title: "Помилка",
      description: error?.message || "Не вдалося зчитати ключ",
      variant: "destructive",
    });
  }
}

async function readPrivateKey() {
  if (!euSign.value) {
    throw new Error("Модуль підпису не ініціалізовано");
  }
  if (!keyFile.value || !keyPassword.value) {
    throw new Error("Оберіть файл ключа та введіть пароль");
  }

  isKeyReading.value = true;
  keyReadStatus.value = "";

  try {
    await ensureTSLLoaded();
    const keyBytes = new Uint8Array(await keyFile.value.arrayBuffer());
    try {
      euSign.value.ReadPrivateKeyBinary(keyBytes, keyPassword.value);
    } catch (readError: any) {
      const w = window as any;
      const errorCode =
        typeof readError?.GetErrorCode === "function"
          ? readError.GetErrorCode()
          : null;
      const certNotFoundCode = w?.EU_ERROR_CERT_NOT_FOUND;

      const message = (readError?.message || "").toString().toLowerCase();
      const isCertNotFound =
        (certNotFoundCode && errorCode === certNotFoundCode) ||
        message.includes("сертиф") ||
        message.includes("cert");

      if (isCertNotFound) {
        keyReadStatus.value = "Шукаємо сертифікат на сервері КНЕДП...";
        const loaded = await tryLoadCertificatesByKeyInfo(
          keyBytes,
          keyPassword.value
        );

        if (loaded) {
          euSign.value.ReadPrivateKeyBinary(keyBytes, keyPassword.value);
        } else {
          throw readError;
        }
      } else {
        throw readError;
      }
    }
    hasLoadedPrivateKey.value = true;
    keyReadStatus.value = "Ключ успішно зчитано";
  } catch (e: any) {
    hasLoadedPrivateKey.value = false;
    keyReadStatus.value = e?.message || "Не вдалося зчитати ключ";
    throw e;
  } finally {
    isKeyReading.value = false;
  }
}

function handleKeyDrop(event: DragEvent) {
  const files = event.dataTransfer?.files;
  if (files && files.length > 0) {
    keyFile.value = files[0];
    hasLoadedPrivateKey.value = false;
    keyReadStatus.value = "";
  }
}

function handleKeyFileChange(event: Event) {
  const files = (event.target as HTMLInputElement).files;
  if (files && files.length > 0) {
    keyFile.value = files[0];
    hasLoadedPrivateKey.value = false;
    keyReadStatus.value = "";
  }
}

function resetKeyState() {
  try {
    if (euSign.value) {
      euSign.value.ResetPrivateKey();
    }
  } catch (e) {
    console.warn("EUSignCP reset warning:", e);
  }
  keyFile.value = null;
  keyPassword.value = "";
  hasLoadedPrivateKey.value = false;
  keyReadStatus.value = "";
}

function formatFileSize(bytes: number) {
  if (!bytes) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${(bytes / Math.pow(k, i)).toFixed(1)} ${sizes[i]}`;
}


async function ensureTSLLoaded() {
  if (tslLoaded.value) return;

  const w = window as any;
  if (w.__eusignTSLLoaded) {
    tslLoaded.value = true;
    return;
  }

  if (!euSign.value) {
    throw new Error("Модуль підпису не ініціалізовано");
  }

  keyReadStatus.value = "Завантаження сертифікатів...";

  try {
    const [dstuRes, etsiRes] = await Promise.all([
      fetch("/api/sign/tsl?type=dstu"),
      fetch("/api/sign/tsl?type=etsi"),
    ]);

    if (dstuRes.ok) {
      const dstuBytes = new Uint8Array(await dstuRes.arrayBuffer());
      euSign.value.SaveTSL(dstuBytes);
    }

    if (etsiRes.ok) {
      const etsiBytes = new Uint8Array(await etsiRes.arrayBuffer());
      euSign.value.SaveTSL(etsiBytes);
    }

    if (w.EndUserTSLSettings && euSign.value.SetTSLSettings) {
      const settings = new w.EndUserTSLSettings(true, false, "");
      euSign.value.SetTSLSettings(settings);
    }

    tslLoaded.value = true;
    w.__eusignTSLLoaded = true;
  } catch (error) {
    console.warn("TSL load failed:", error);
  } finally {
    if (!hasLoadedPrivateKey.value) {
      keyReadStatus.value = "";
    }
  }
}

async function tryLoadCertificatesByKeyInfo(
  keyBytes: Uint8Array,
  password: string
) {
  if (!euSign.value) return false;

  try {
    const cmpServers = getCmpServers(providerMode.value);
    if (!cmpServers.length) return false;

    const keyInfo = euSign.value.GetKeyInfoBinary(keyBytes, password);
    const certs = euSign.value.GetCertificatesByKeyInfo(keyInfo, cmpServers);

    if (certs && certs.length) {
      euSign.value.SaveCertificates(certs);
      return true;
    }
  } catch (error) {
    console.warn("CMP certificate fetch failed:", error);
  }

  return false;
}

function getCmpServers(mode: string) {
  const uakey = ["uakey.com.ua:2560", "uakey.com.ua"];

  if (mode === "uakey") {
    return uakey;
  }

  return uakey;
}
</script>

<style lang="scss">
.dialog-footer {
  position: absolute;
  bottom: 20px;
  right: 20px
}

.sign-key {
  display: flex;
  flex-direction: column;
  gap: 16px;
  padding: 8px 4px 80px;
}

.sign-tabs {
  display: flex;
  gap: 24px;
  font-size: 18px;
}

.sign-tab {
  background: transparent;
  border: none;
  font-weight: 600;
  padding: 6px 0;
  cursor: pointer;
}

.sign-tab-active {
  border-bottom: 2px solid #111827;
  color: #111827;
}

.sign-tab-disabled {
  color: #9ca3af;
}

.sign-provider {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.sign-provider-label {
  color: #6b7280;
  font-size: 14px;
}

.sign-provider-select {
  border: none;
  border-bottom: 2px solid #111827;
  font-size: 18px;
  padding: 6px 0;
  background: transparent;
  outline: none;
}

.sign-dropzone {
  border: 2px dashed #9ca3af;
  border-radius: 12px;
  padding: 28px;
  text-align: center;
  cursor: pointer;
  background: #fafafa;
}

.sign-dropzone-title {
  font-weight: 600;
  font-size: 18px;
  color: #111827;
}

.sign-dropzone-link {
  text-decoration: underline;
}

.sign-dropzone-hint {
  margin-top: 8px;
  color: #6b7280;
  font-size: 14px;
}

.sign-dropzone-file {
  display: flex;
  flex-direction: column;
  gap: 6px;
  font-size: 16px;
  color: #111827;
}

.sign-dropzone-file-size {
  color: #6b7280;
  font-size: 14px;
}

.sign-password-input {
  width: 100%;
  border: none;
  border-bottom: 2px solid #9ca3af;
  font-size: 18px;
  padding: 8px 0;
  outline: none;
}

.sign-read-actions {
  display: flex;
  align-items: center;
  gap: 16px;
}

.sign-read-status {
  color: #111827;
  font-size: 14px;
}
</style>

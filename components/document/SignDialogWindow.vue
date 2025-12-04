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

      <DialogFooter class="dialog-footer">
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
import { Loader2 } from "lucide-vue-next"

const adminStore = useAdminStore();
const route = useRoute();
const router = useRouter();
const userStore = useUserStore();
const isDialogOpen = ref(false);
const { toast } = useToast();
const euSign = ref(null);

const isLoading = ref(false);
const MAX_SIGNATURES_PER_ORG = 2;

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

  console.log("🚀 Начинаем процесс подписания документа");
  isLoading.value = true;

  const currentDoc = adminStore.getDocumentById(parseInt(route.query.documentSign));

  console.log("📄 Текущий документ:", {
    id: currentDoc?.id,
    signaturesCount: currentDoc?.Signature?.length || 0,
    hasSignatures: currentDoc?.Signature?.length > 0
  });

  try {
    const filePath = currentDoc.Signature.length !== 0 ? currentDoc.Signature[currentDoc.Signature.length - 1].stampedFile : currentDoc?.filePath;

    console.log("filePath", filePath);


    if (!filePath) {
      toast({
        title: "Ошибка",
        description: 'Файл для подписи не найден',
        variant: "destructive",
      });
      return;
    };

    const file = await fetchFile(filePath);

    if (!file) {
      toast({
        title: "Ошибка",
        description: 'Не удалось загрузить файл для подписи',
        variant: "destructive",
      });
      return;
    }

    console.log("📂 Файл для подписи загружен:", {
      name: file.name,
      size: file.size,
      type: file.type
    });

    const reader = new FileReader();

    controlFlag.value = false;

    reader.onload = async () => {
      // Получаем ArrayBuffer напрямую из файла (без PAdES подписи)
      const originalArrayBuffer = reader.result as ArrayBuffer;
      const binary = new Uint8Array(reader.result as ArrayBuffer);
      const base64data = arrayBufferToBase64(binary);

      // 3. Считать ключ (вызовет диалог с iframe, если еще не был считан)
      await euSign.value.ReadPrivateKey();

      console.log("🔑 Ключ успешно прочитан, начинаем подписание...");

      // 4. Подписать
      const external = false;
      const asBase64String = true;
      const signAlgo = EndUser.SignAlgo.DSTU4145WithGOST34311;
      const signType = EndUser.SignType.CAdES_X_Long_Trusted;

      console.log("📝 Параметры подписания:", {
        external,
        asBase64String,
        dataSize: base64data.length
      });

      const sign = await euSign.value.SignData(
        base64data,
        external,
        asBase64String,
        signAlgo,
        null,
        signType
      );

      console.log("✍️ Подпись создана:", {
        signSize: sign ? sign.length : 0,
        signType: typeof sign
      });



      const blob = base64ToBlob(sign, "application/pkcs7-signature");
      const signedFile = new File([blob], `${file.name}`, { type: "application/pkcs7-signature" });

      console.log("🔍 Создан signedFile:", {
        name: signedFile.name,
        size: signedFile.size,
        type: signedFile.type,
        lastModified: signedFile.lastModified
      });

      // НОВОЕ: Извлекаем certInfo из подписи на клиенте
      let certInfo = null;
      let stampData = {
        organizationName: "",
        signerINN: "",
        signerName: "",
        signerPosition: "",
        stampCount: 0,
      };
      try {
        // Создаем временный FormData для отправки подписи на сервер для анализа
        const tempFormData = new FormData();
        tempFormData.append('signature', signedFile);

        const certInfoResponse = await $fetch('/api/sign/extractCertInfo', {
          method: 'POST',
          body: tempFormData
        });

        if (certInfoResponse.code === 200) {
          certInfo = certInfoResponse.body.certInfo;
          console.log('Извлеченная информация о сертификате:', certInfo);

          // Парсим данные из сертификата
          const parsedCertData = parseCertificateInfo(certInfo);

          console.log(parsedCertData);

          const currentOrgName = parsedCertData.organizationName || parsedCertData.fullName || '';
          const normalizedCurrentOrgName = normalizeOrganizationName(currentOrgName);

          const existingOrgCounts = getOrganizationSignCounts(currentDoc?.Signature || []);
          const existingOrgSignCount = normalizedCurrentOrgName ? (existingOrgCounts.get(normalizedCurrentOrgName) || 0) : 0;

          if (normalizedCurrentOrgName && existingOrgSignCount >= MAX_SIGNATURES_PER_ORG) {
            toast({
              title: "Обмеження підписів",
              description: `Організація "${currentOrgName}" вже підписувала цей документ ${MAX_SIGNATURES_PER_ORG} рази.`,
              variant: "destructive",
            });
            isLoading.value = false;
            return;
          }

          // Обновляем stampData данными из сертификата
          stampData = {
            organizationName: parsedCertData.organizationName || "",
            signerINN: parsedCertData.inn || "",
            signerName: parsedCertData.fullName || "",
            signerPosition: parsedCertData.position || "",
            stampCount: currentDoc.Signature.length || 0,
          };

          console.log('Данные для печати:', stampData);
        }
      } catch (certError) {
        console.error('Ошибка извлечения информации о сертификате:', certError);
        // Продолжаем без certInfo, но с предупреждением
      }

      // const finalPdfBytes = await addVisibleStamp(originalArrayBuffer, stampData);

      // 5. Создать финальный PDF-файл с печатью
      const finalPdfBlob = new Blob([originalArrayBuffer], { type: "application/pdf" });
      const finalPdfFile = new File([finalPdfBlob], `${file.name}`, { type: "application/pdf" });

      console.log("📄 Создан finalPdfFile:", {
        name: finalPdfFile.name,
        size: finalPdfFile.size,
        type: finalPdfFile.type,
        originalSize: originalArrayBuffer.byteLength
      });

      // Валидация файлов перед отправкой
      if (!signedFile.size || !finalPdfFile.size) {
        throw new Error("Ошибка: размер одного из файлов равен 0");
      }

      if (signedFile.size < 100) {
        throw new Error("Ошибка: размер подписи слишком мал");
      }

      if (finalPdfFile.size < 1000) {
        throw new Error("Ошибка: размер PDF файла слишком мал");
      }

      console.log("✅ Файлы прошли валидацию, отправляем на сервер...");

      await adminStore.createSign(
        parseInt(route.query.documentSign),
        userStore.userGetter.id,
        signedFile,
        finalPdfFile,
        certInfo,
        stampData).then(async (result) => {
          console.log("✅ Подпись успешно создана:", result);

          // Проверяем доступность созданных файлов
          const verificationPromises = [];

          if (result?.signature) {
            console.log("🔍 Проверяем файл подписи:", result.signature);

            verificationPromises.push(
              fetch(result.signature, { method: 'HEAD' })
                .then(response => ({
                  type: 'signature',
                  exists: response.ok,
                  url: result.signature,
                  status: response.status
                }))
                .catch(error => ({
                  type: 'signature',
                  exists: false,
                  url: result.signature,
                  error: error.message
                }))
            );
          }

          if (result?.stampedFile) {
            console.log("🔍 Проверяем штампованный файл:", result.stampedFile);

            verificationPromises.push(
              fetch(result.stampedFile, { method: 'HEAD' })
                .then(response => ({
                  type: 'stampedFile',
                  exists: response.ok,
                  url: result.stampedFile,
                  status: response.status
                }))
                .catch(error => ({
                  type: 'stampedFile',
                  exists: false,
                  url: result.stampedFile,
                  error: error.message
                }))
            );
          }

          if (verificationPromises.length > 0) {
            const verificationResults = await Promise.all(verificationPromises);

            console.log("🔍 Результаты проверки файлов:", verificationResults);

            const missingFiles = verificationResults.filter(r => !r.exists);

            if (missingFiles.length > 0) {
              console.error("❌ Некоторые файлы подписи недоступны:", missingFiles);
              console.error("❌ Детали недоступных файлов:", missingFiles.map(f => ({
                type: f.type,
                originalUrl: f.url,
                status: 'status' in f ? f.status : 'N/A',
                error: 'error' in f ? f.error : 'N/A'
              })));

              // Удаляем подпись из базы данных
              try {
                await adminStore.deleteSignature(result.id);
                console.log("🗑️ Подпись удалена из-за недоступности файлов");
              } catch (deleteError) {
                console.error("❌ Ошибка при удалении подписи:", deleteError);
              }

              toast({
                title: "Помилка збереження",
                description: "Файли підпису не були збережені коректно. Підпис скасовано. Спробуйте ще раз.",
                variant: "destructive",
              });

              isDialogOpen.value = false;
              setTimeout(() => {
                window.location.reload();
              }, 1000);
              return;
            } else {
              console.log("✅ Все файлы доступны:", verificationResults);
            }
          }

          // Если все файлы доступны
          toast({
            title: "Успіх",
            description: "Документ успішно підписано. Зачекайте, поки вікно закриється.",
            variant: "default",
          });
          isDialogOpen.value = false;
          setTimeout(() => {
            window.location.reload();
          }, 800);
        }).catch((error) => {
          console.error("❌ Ошибка при создании подписи:", error);
          throw new Error(`Ошибка сохранения подписи: ${error.message || error}`);
        });
    };

    reader.readAsArrayBuffer(file);

    // controlFlag.value = true;
  } catch (e: any) {
    console.error("❌ Ошибка в процессе подписания:", e);
    console.error("Детали ошибки:", {
      message: e?.message,
      stack: e?.stack,
      name: e?.name
    });

    toast({
      title: "Ошибка",
      description: e?.message || e,
      variant: "destructive",
    });
  } finally {
    console.log("🏁 Завершение процесса подписания, isLoading = false");
    isLoading.value = false;
  }
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

    // ---- Берем только Subject владельца ----
    const subjectMatch = certInfo.match(/Subject: (.+?)(?:\n|$)/s);
    if (subjectMatch) {
      const subject = subjectMatch[1];
      console.log('Subject владельца:', subject);

      // === ФИО/Название организации ===
      const cnMatch = subject.match(/CN=([^,\n]+)/);
      if (cnMatch) {
        result.fullName = decodeHexString(cnMatch[1]).trim();
        // Если это организация, то название организации тоже берем из CN
        result.organizationName = result.fullName;
      }

      // === ИНН - ищем в разных местах ===
      // 1. В serialNumber Subject'а (как в вашем случае)
      const subjectSerialMatch = subject.match(/serialNumber=(\d+)/);
      if (subjectSerialMatch) {
        result.inn = subjectSerialMatch[1];
        console.log('INN найден в Subject serialNumber:', result.inn);
      }

      // 2. В TINUA формате (fallback)
      if (!result.inn) {
        const innMatch = subject.match(/serialNumber=TINUA-(\d+)/);
        if (innMatch) {
          result.inn = innMatch[1];
          console.log('INN найден в TINUA формате:', result.inn);
        }
      }

      // 3. В UID (fallback)
      if (!result.inn) {
        const uidMatch = subject.match(/UID=(\d+)/);
        if (uidMatch) {
          result.inn = uidMatch[1];
          console.log('INN найден в UID:', result.inn);
        }
      }

      // === Должность/Регион ===
      // Сначала ищем должность в title
      const titleMatch = subject.match(/title=([^,\n]+)/i) || subject.match(/T=([^,\n]+)/i);
      if (titleMatch) {
        const titleValue = decodeHexString(titleMatch[1]).trim();
        result.position = titleValue;
        console.log('Позиция найдена в title:', titleValue);
      }
      // Если нет title, берем ST (State/область)
      else {
        const stMatch = subject.match(/ST=([^,\n]+)/i);
        if (stMatch) {
          result.position = decodeHexString(stMatch[1]).trim();
          console.log('Позиция взята из ST (область):', result.position);
        }
      }

      // Fallback на OU
      if (!result.position || result.position === 'не видан') {
        const ouMatch = subject.match(/OU=([^,\n]+)/i);
        if (ouMatch) {
          const ouVal = decodeHexString(ouMatch[1]).trim();
          if (ouVal && ouVal !== "ФІЗИЧНА ОСОБА") {
            result.position = ouVal;
          }
        }
      }

      // === ПРОВЕРКА НА ДИРЕКТОРА ===
      // Проверяем весь Subject на наличие вариаций слова "директор"
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

      // Дополнительно проверяем в CN и title
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

      // === Организация ===
      // Если CN уже содержит название организации, используем его
      if (result.fullName && (result.fullName.includes('ТОВ') || result.fullName.includes('ООО') || result.fullName.includes('ПП') || result.fullName.includes('ФОП'))) {
        result.organizationName = result.fullName;
      } else {
        // Иначе ищем в O
        const oMatch = subject.match(/O=([^,\n]+)/i);
        if (oMatch) {
          const oVal = decodeHexString(oMatch[1]).trim();
          if (oVal && oVal !== "ФІЗИЧНА ОСОБА") {
            result.organizationName = oVal;
          }
        }
      }
    }

    // === Дополнительно проверяем Issuer для INN ===
    if (!result.inn) {
      const issuerMatch = certInfo.match(/Issuer: (.+?)(?:\n|$)/s);
      if (issuerMatch) {
        const issuer = issuerMatch[1];
        const issuerSerialMatch = issuer.match(/serialNumber=UA-(\d+)/);
        if (issuerSerialMatch) {
          // Это INN выдавшей организации, не владельца
          console.log('Найден INN выдавшей организации, но не владельца');
        }
      }
    }

    // === Проверяем X509v3 Subject Directory Attributes ===
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

  // Проверяем что данные корректны
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

// Функция для декодирования hex-encoded строк
function decodeHexString(hexStr: string): string {
  try {
    if (!hexStr) return '';

    // Убираем экранирующие символы и декодируем hex
    const cleaned = hexStr.replace(/\\x([0-9A-Fa-f]{2})/g, (match, hex) => {
      return String.fromCharCode(parseInt(hex, 16));
    });

    // Если строка содержала hex-кодирование, декодируем UTF-8
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

.dialog-footer {
  position: absolute;
  bottom: 20px;
  right: 20px
}
</style>

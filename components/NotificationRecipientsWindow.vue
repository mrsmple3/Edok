<template>
  <Dialog v-model:open="isDialogOpen">
    <DialogTrigger>
      <button
        class="relative notif-trigger-btn bg-[#2d9cdb]/20 flex items-center justify-center"
        title="Пошти для сповіщень"
      >
        <Mail class="notif-trigger-icon text-[#2d9cdb]" />
      </button>
    </DialogTrigger>
    <DialogContent>
      <DialogHeader>
        <DialogTitle>Пошти для сповіщень</DialogTitle>
        <DialogDescription>
          На ці адреси надходитиме лист при кожному підписанні документа. Можна додавати,
          вимикати та видаляти адреси.
        </DialogDescription>
      </DialogHeader>

      <div class="grid gap-4 py-2">
        <!-- Форма добавления -->
        <form class="flex items-end gap-2" @submit.prevent="addRecipient">
          <div class="flex flex-col gap-1 flex-grow">
            <Label for="newRecipientEmail" class="text-xs text-start">Пошта</Label>
            <Input
              id="newRecipientEmail"
              v-model="newEmail"
              type="text"
              placeholder="example@mail.com"
            />
          </div>
          <Button type="submit" :disabled="isAdding">Додати</Button>
        </form>

        <!-- Список -->
        <div class="flex flex-col gap-2 max-h-[320px] overflow-y-auto">
          <div
            v-for="r in recipients"
            :key="r.id"
            class="flex items-center justify-between gap-3 rounded-md border px-3 py-2"
          >
            <div class="flex items-center gap-2 min-w-0">
              <input
                :id="`recipient-enabled-${r.id}`"
                type="checkbox"
                class="h-4 w-4 shrink-0"
                :checked="r.enabled"
                @change="toggleEnabled(r)"
              />
              <span
                class="truncate text-sm"
                :class="r.enabled ? 'text-black' : 'text-gray-400 line-through'"
                :title="r.email"
              >
                {{ r.email }}
              </span>
            </div>
            <button
              class="shrink-0 text-red-500 hover:text-red-700 transition-colors"
              title="Видалити"
              @click="removeRecipient(r)"
            >
              <Trash2 class="h-4 w-4" />
            </button>
          </div>

          <p v-if="recipients.length === 0" class="text-sm text-gray-400 text-center py-4">
            Поки що немає жодної адреси.
          </p>
        </div>
      </div>
    </DialogContent>
  </Dialog>
</template>

<script setup lang="ts">
import { Mail, Trash2 } from "lucide-vue-next";
import { useUserStore } from "~/store/user.store";
import { useToast } from "~/components/ui/toast";
import type { NotificationRecipient } from "~/store/user.store";

const userStore = useUserStore();
const { toast } = useToast();

const isDialogOpen = ref(false);
const newEmail = ref("");
const isAdding = ref(false);

const recipients = computed<NotificationRecipient[]>(() => userStore.$state.notificationRecipients);

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

watch(isDialogOpen, async (open) => {
  if (open) {
    await userStore.getNotificationRecipients();
  }
});

async function addRecipient() {
  const email = newEmail.value.trim().toLowerCase();
  if (!email || !EMAIL_RE.test(email)) {
    toast({ title: "Помилка", description: "Невірний формат email", variant: "destructive" });
    return;
  }
  isAdding.value = true;
  try {
    const created = await userStore.addNotificationRecipient({ email });
    if (created) {
      newEmail.value = "";
      toast({ title: "Додано", description: email });
    }
  } finally {
    isAdding.value = false;
  }
}

async function toggleEnabled(r: NotificationRecipient) {
  await userStore.updateNotificationRecipient(r.id, { enabled: !r.enabled });
}

async function removeRecipient(r: NotificationRecipient) {
  const ok = await userStore.deleteNotificationRecipient(r.id);
  if (ok) {
    toast({ title: "Видалено", description: r.email });
  }
}
</script>

<style scoped lang="scss">
.notif-trigger-btn {
  width: size(48px);
  height: size(48px);
  border-radius: size(15px);
}

.notif-trigger-icon {
  width: size(28px);
  height: size(28px);
}
</style>

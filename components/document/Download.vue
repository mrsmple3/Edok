<template>
  <Dialog v-model:open="isDialogOpen">
    <DialogTrigger>
      Скачати
    </DialogTrigger>
    <DialogContent class="!max-w-[80vw] !w-[80vw] h-[75vh]">
      <DialogHeader>
        <DialogTitle>Документы </DialogTitle>
        <DialogDescription>
          Файли для скачування
        </DialogDescription>
        <div class="w-full flex flex-col gap-2 mt-4">
          <a v-if="props.invoice.filePath" :href="props.invoice.filePath" class="underline text-blue-600" download>
            📄 Завантажити документ
          </a>
          <a v-if="props.invoice.Signature.length !== 0" :href="`/api/download/archive/${Number(props.invoice.id)}`"
            class="underline text-blue-600" download>
            📦 Завантажити ZIP-архів із документами
          </a>
        </div>
      </DialogHeader>
    </DialogContent>
  </Dialog>
</template>

<script setup lang="ts">
const props = defineProps({
  invoice: {
    type: Object,
    required: true,
  },
});
const isDialogOpen = ref(false);
</script>

<script setup lang="ts">
import type { FileCompleteEvent } from '../composables/useWebSocket'

defineProps<{
  files: FileCompleteEvent[]
}>()
</script>

<template>
  <div class="card">
    <div class="card-title">Completed Files</div>

    <div class="file-list">
      <div
        v-for="(file, index) in files"
        :key="index"
        class="file-item"
        :class="file.success ? 'success' : 'error'"
      >
        <span class="file-icon">{{ file.success ? '✓' : '✗' }}</span>
        <span class="file-name">{{ file.file }}</span>
        <span v-if="!file.success && file.error" class="file-error">
          {{ file.error }}
        </span>
      </div>
    </div>
  </div>
</template>

<style scoped>
.file-name {
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.file-icon {
  flex-shrink: 0;
}

.file-error {
  font-size: 0.75rem;
  color: var(--color-error);
}
</style>

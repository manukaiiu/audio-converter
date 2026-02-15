<script setup lang="ts">
defineProps<{
  modelValue: string
  isScanning: boolean
  scanResult: {
    totalFiles: number
    needsConversion: Array<{ name: string }>
    alreadyConverted: number
    structure: string
  } | null
  error: string | null
}>()

const emit = defineEmits<{
  'update:modelValue': [value: string]
  scan: []
}>()

function handleInput(event: Event) {
  const target = event.target as HTMLInputElement
  emit('update:modelValue', target.value)
}
</script>

<template>
  <div class="card">
    <div class="card-title">Source Folder</div>

    <div class="input-row">
      <input
        type="text"
        class="input"
        :value="modelValue"
        @input="handleInput"
        placeholder="Enter folder path (e.g., D:\Music\Artist)"
        :disabled="isScanning"
      />
      <button
        class="btn btn-secondary"
        @click="$emit('scan')"
        :disabled="!modelValue || isScanning"
      >
        {{ isScanning ? 'Scanning...' : 'Scan' }}
      </button>
    </div>

    <div v-if="error" class="error-message">
      {{ error }}
    </div>

    <div v-if="scanResult" class="scan-result">
      <div class="folder-info">
        <span class="folder-icon">📁</span>
        <span>{{ modelValue }}</span>
      </div>
      <div class="file-count">
        Found: {{ scanResult.totalFiles }} FLAC files
        <span v-if="scanResult.alreadyConverted > 0">
          ({{ scanResult.needsConversion.length }} need conversion)
        </span>
      </div>
      <div v-if="scanResult.structure !== 'already-organized'" class="structure-hint">
        Structure: {{ scanResult.structure }}
      </div>
    </div>
  </div>
</template>

<style scoped>
.input-row {
  display: flex;
  gap: var(--spacing-sm);
}

.input-row .input {
  flex: 1;
}

.error-message {
  margin-top: var(--spacing-sm);
  color: var(--color-error);
  font-size: 0.875rem;
}

.scan-result {
  margin-top: var(--spacing-md);
  padding-top: var(--spacing-md);
  border-top: 1px solid var(--color-border);
}

.folder-info {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
  color: var(--color-text);
  margin-bottom: var(--spacing-xs);
}

.folder-icon {
  font-size: 1.25rem;
}

.file-count {
  color: var(--color-text-muted);
  font-size: 0.875rem;
}

.structure-hint {
  color: var(--color-text-muted);
  font-size: 0.75rem;
  margin-top: var(--spacing-xs);
}
</style>

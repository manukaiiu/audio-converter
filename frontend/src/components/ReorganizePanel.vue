<script setup lang="ts">
import { ref } from 'vue'

const props = defineProps<{
  folderPath: string
  structure: string
}>()

const emit = defineEmits<{
  (e: 'reorganized'): void
}>()

const isReorganizing = ref(false)
const error = ref<string | null>(null)
const success = ref(false)

async function handleReorganize() {
  isReorganizing.value = true
  error.value = null
  success.value = false

  try {
    const response = await fetch('/api/reorganize', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ folderPath: props.folderPath })
    })

    if (!response.ok) {
      const data = await response.json()
      throw new Error(data.error || 'Reorganization failed')
    }

    success.value = true
    emit('reorganized')
  } catch (err) {
    error.value = err instanceof Error ? err.message : 'Reorganization failed'
  } finally {
    isReorganizing.value = false
  }
}
</script>

<template>
  <div v-if="structure === 'flat-flac'" class="card reorganize-panel">
    <div class="reorganize-header">
      <h3>Folder Reorganization</h3>
    </div>

    <p class="description">
      Your folder contains FLAC files directly without a <code>flac/</code> subfolder.
      Would you like to reorganize it into the recommended structure?
    </p>

    <div class="structure-preview">
      <div class="structure-column">
        <span class="label">Current:</span>
        <pre>album/
├── track1.flac
├── track2.flac
└── cover.jpg</pre>
      </div>
      <span class="arrow">→</span>
      <div class="structure-column">
        <span class="label">After:</span>
        <pre>album/
├── flac/
│   ├── track1.flac
│   └── track2.flac
├── m4a/
│   └── (converted files)
└── cover.jpg</pre>
      </div>
    </div>

    <div v-if="error" class="error-message">{{ error }}</div>
    <div v-if="success" class="success-message">Reorganization complete! Rescanning...</div>

    <button
      class="btn btn-secondary"
      :disabled="isReorganizing"
      @click="handleReorganize"
    >
      {{ isReorganizing ? 'Reorganizing...' : 'Reorganize Folder' }}
    </button>
  </div>
</template>

<style scoped>
.reorganize-panel {
  border-color: var(--color-primary-light);
  background: linear-gradient(135deg, var(--color-bg-card) 0%, rgba(124, 58, 237, 0.1) 100%);
}

.reorganize-header h3 {
  margin: 0 0 var(--spacing-md) 0;
  color: var(--color-primary-light);
}

.description {
  color: var(--color-text-muted);
  margin-bottom: var(--spacing-lg);
}

.description code {
  background: rgba(124, 58, 237, 0.2);
  padding: 0.1em 0.4em;
  border-radius: 4px;
  color: var(--color-primary-light);
}

.structure-preview {
  display: flex;
  align-items: center;
  gap: var(--spacing-lg);
  margin-bottom: var(--spacing-lg);
  padding: var(--spacing-md);
  background: var(--color-bg);
  border-radius: 8px;
}

.structure-column {
  flex: 1;
}

.structure-column .label {
  display: block;
  font-size: 0.75rem;
  text-transform: uppercase;
  color: var(--color-text-muted);
  margin-bottom: var(--spacing-sm);
}

.structure-column pre {
  margin: 0;
  font-size: 0.85rem;
  line-height: 1.5;
  color: var(--color-text);
}

.arrow {
  font-size: 1.5rem;
  color: var(--color-primary-light);
}

.error-message {
  color: var(--color-error);
  margin-bottom: var(--spacing-md);
}

.success-message {
  color: var(--color-success);
  margin-bottom: var(--spacing-md);
}

.btn-secondary {
  background: transparent;
  border: 1px solid var(--color-primary);
  color: var(--color-primary-light);
}

.btn-secondary:hover:not(:disabled) {
  background: rgba(124, 58, 237, 0.2);
}
</style>

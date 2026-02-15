<script setup lang="ts">
import { ref, computed } from 'vue'
import { useWebSocket } from './composables/useWebSocket'
import FolderSelector from './components/FolderSelector.vue'
import SettingsPanel from './components/SettingsPanel.vue'
import ReorganizePanel from './components/ReorganizePanel.vue'
import ConvertButton from './components/ConvertButton.vue'
import ProgressPanel from './components/ProgressPanel.vue'
import FileList from './components/FileList.vue'

const folderPath = ref('')
const scanResult = ref<{
  totalFiles: number
  needsConversion: Array<{ name: string }>
  alreadyConverted: number
  structure: string
} | null>(null)
const isScanning = ref(false)
const isConverting = ref(false)
const scanError = ref<string | null>(null)

const { connected, progress, completedFiles, jobResult, error: wsError, reset } = useWebSocket()

const filesToConvert = computed(() => scanResult.value?.needsConversion.length ?? 0)

async function handleScan() {
  if (!folderPath.value) return

  isScanning.value = true
  scanError.value = null
  scanResult.value = null

  try {
    const response = await fetch('/api/scan', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ folderPath: folderPath.value })
    })

    if (!response.ok) {
      const data = await response.json()
      throw new Error(data.error || 'Scan failed')
    }

    scanResult.value = await response.json()
  } catch (err) {
    scanError.value = err instanceof Error ? err.message : 'Scan failed'
  } finally {
    isScanning.value = false
  }
}

async function handleConvert() {
  if (!folderPath.value || filesToConvert.value === 0) return

  isConverting.value = true
  reset()

  try {
    const response = await fetch('/api/convert', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ folderPath: folderPath.value })
    })

    if (!response.ok) {
      const data = await response.json()
      throw new Error(data.error || 'Conversion failed')
    }
  } catch (err) {
    scanError.value = err instanceof Error ? err.message : 'Conversion failed'
    isConverting.value = false
  }
}

async function handleCancel() {
  try {
    await fetch('/api/cancel', { method: 'POST' })
  } catch {
    // Ignore cancel errors
  }
  isConverting.value = false
}

// Watch for job completion
import { watch } from 'vue'
watch(jobResult, (result) => {
  if (result) {
    isConverting.value = false
    // Refresh scan results
    handleScan()
  }
})
</script>

<template>
  <div class="app">
    <header class="header">
      <h1>Audio Converter</h1>
      <div class="status">
        <span class="status-dot" :class="connected ? 'success' : 'error'"></span>
        {{ connected ? 'Connected' : 'Disconnected' }}
      </div>
    </header>

    <FolderSelector
      v-model="folderPath"
      :is-scanning="isScanning"
      :scan-result="scanResult"
      :error="scanError"
      @scan="handleScan"
    />

    <SettingsPanel />

    <ReorganizePanel
      v-if="scanResult"
      :folder-path="folderPath"
      :structure="scanResult.structure"
      @reorganized="handleScan"
    />

    <ConvertButton
      :disabled="filesToConvert === 0 || isConverting || isScanning"
      :is-converting="isConverting"
      @convert="handleConvert"
      @cancel="handleCancel"
    />

    <ProgressPanel
      v-if="progress || jobResult"
      :progress="progress"
      :job-result="jobResult"
    />

    <FileList
      v-if="completedFiles.length > 0"
      :files="completedFiles"
    />

    <div v-if="wsError" class="card error-card">
      <p>{{ wsError }}</p>
    </div>
  </div>
</template>

<style scoped>
.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: var(--spacing-xl);
}

.header h1 {
  font-size: 1.5rem;
  font-weight: 600;
}

.error-card {
  background-color: rgba(239, 68, 68, 0.1);
  border-color: var(--color-error);
  color: var(--color-error);
}
</style>

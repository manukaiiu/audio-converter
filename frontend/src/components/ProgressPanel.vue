<script setup lang="ts">
import type { JobProgress, JobResult } from '../composables/useWebSocket'

defineProps<{
  progress: JobProgress | null
  jobResult: JobResult | null
}>()

function formatTime(seconds: number): string {
  if (!seconds || !isFinite(seconds)) return '--:--'
  const mins = Math.floor(seconds / 60)
  const secs = Math.floor(seconds % 60)
  return `${mins}:${secs.toString().padStart(2, '0')}`
}
</script>

<template>
  <div class="card">
    <div class="card-title">Progress</div>

    <!-- Active conversion -->
    <template v-if="progress">
      <div class="progress-section">
        <div class="progress-header">
          <span>Overall: {{ progress.currentFileIndex }}/{{ progress.totalFiles }}</span>
          <span>{{ Math.round(progress.overallProgress) }}%</span>
        </div>
        <div class="progress-bar">
          <div
            class="progress-bar-fill"
            :style="{ width: `${progress.overallProgress}%` }"
          ></div>
        </div>
        <div class="progress-eta">
          ETA: {{ formatTime(progress.overallEta) }} remaining
        </div>
      </div>

      <div class="progress-section current-file">
        <div class="progress-header">
          <span class="current-file-name">{{ progress.currentFile }}</span>
          <span>{{ Math.round(progress.fileProgress) }}%</span>
        </div>
        <div class="progress-bar">
          <div
            class="progress-bar-fill"
            :style="{ width: `${progress.fileProgress}%` }"
          ></div>
        </div>
        <div class="progress-eta">
          ~{{ formatTime(progress.fileEta) }}
        </div>
      </div>
    </template>

    <!-- Completed job -->
    <template v-else-if="jobResult">
      <div class="job-result">
        <div class="result-icon" :class="jobResult.failed === 0 ? 'success' : 'warning'">
          {{ jobResult.failed === 0 ? '✓' : '!' }}
        </div>
        <div class="result-text">
          <div class="result-title">Conversion Complete</div>
          <div class="result-stats">
            {{ jobResult.successful }} successful
            <span v-if="jobResult.failed > 0">, {{ jobResult.failed }} failed</span>
          </div>
        </div>
      </div>
    </template>
  </div>
</template>

<style scoped>
.progress-section {
  margin-bottom: var(--spacing-md);
}

.progress-section:last-child {
  margin-bottom: 0;
}

.progress-header {
  display: flex;
  justify-content: space-between;
  margin-bottom: var(--spacing-xs);
  font-size: 0.875rem;
}

.progress-eta {
  margin-top: var(--spacing-xs);
  font-size: 0.75rem;
  color: var(--color-text-muted);
}

.current-file {
  padding-top: var(--spacing-md);
  border-top: 1px solid var(--color-border);
}

.current-file-name {
  color: var(--color-text-muted);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  max-width: 300px;
}

.job-result {
  display: flex;
  align-items: center;
  gap: var(--spacing-md);
}

.result-icon {
  width: 48px;
  height: 48px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.5rem;
}

.result-icon.success {
  background-color: rgba(34, 197, 94, 0.2);
  color: var(--color-success);
}

.result-icon.warning {
  background-color: rgba(234, 179, 8, 0.2);
  color: #eab308;
}

.result-title {
  font-weight: 600;
  margin-bottom: var(--spacing-xs);
}

.result-stats {
  font-size: 0.875rem;
  color: var(--color-text-muted);
}
</style>

<script setup lang="ts">
// Settings are fixed for now - display only
</script>

<template>
  <div class="card">
    <div class="card-title">Settings</div>

    <div class="settings-grid">
      <div class="setting">
        <span class="label">Format:</span>
        <span class="value">M4A (AAC)</span>
      </div>
      <div class="setting">
        <span class="label">Quality:</span>
        <span class="value">256 kbps</span>
      </div>
      <div class="setting">
        <span class="checkbox checked">✓</span>
        <span>Preserve album art</span>
      </div>
      <div class="setting">
        <span class="checkbox checked">✓</span>
        <span>Skip existing files</span>
      </div>
    </div>
  </div>
</template>

<style scoped>
.settings-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: var(--spacing-sm) var(--spacing-lg);
}

.setting {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
  font-size: 0.875rem;
}

.label {
  color: var(--color-text-muted);
}

.value {
  color: var(--color-text);
}

.checkbox {
  width: 18px;
  height: 18px;
  border-radius: var(--radius-sm);
  background-color: var(--color-bg);
  border: 1px solid var(--color-border);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.75rem;
  color: transparent;
}

.checkbox.checked {
  background-color: var(--color-primary);
  border-color: var(--color-primary);
  color: white;
}
</style>

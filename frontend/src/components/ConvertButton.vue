<script setup lang="ts">
defineProps<{
  disabled: boolean
  isConverting: boolean
}>()

defineEmits<{
  convert: []
  cancel: []
}>()
</script>

<template>
  <div class="card">
    <button
      v-if="!isConverting"
      class="btn btn-primary btn-block"
      :disabled="disabled"
      @click="$emit('convert')"
    >
      Start Conversion
    </button>
    <button
      v-else
      class="btn btn-secondary btn-block"
      @click="$emit('cancel')"
    >
      Cancel
    </button>
  </div>
</template>

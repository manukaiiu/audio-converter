import { ref, onMounted, onUnmounted } from 'vue'

export interface JobProgress {
  currentFile: string
  currentFileIndex: number
  totalFiles: number
  fileProgress: number
  fileEta: number
  overallProgress: number
  overallEta: number
}

export interface FileCompleteEvent {
  file: string
  success: boolean
  error?: string
}

export interface JobResult {
  totalFiles: number
  successful: number
  failed: number
  errors: Array<{ file: string; error: string }>
}

export function useWebSocket() {
  const connected = ref(false)
  const progress = ref<JobProgress | null>(null)
  const completedFiles = ref<FileCompleteEvent[]>([])
  const jobResult = ref<JobResult | null>(null)
  const error = ref<string | null>(null)

  let ws: WebSocket | null = null
  let reconnectTimeout: number | null = null

  function connect() {
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:'
    const host = window.location.hostname
    const port = 3001 // Backend port

    ws = new WebSocket(`${protocol}//${host}:${port}`)

    ws.onopen = () => {
      connected.value = true
      error.value = null
    }

    ws.onclose = () => {
      connected.value = false
      // Try to reconnect after 2 seconds
      reconnectTimeout = window.setTimeout(connect, 2000)
    }

    ws.onerror = () => {
      error.value = 'WebSocket connection error'
    }

    ws.onmessage = (event) => {
      try {
        const message = JSON.parse(event.data)

        switch (message.event) {
          case 'progress':
            progress.value = message.data
            break
          case 'file-complete':
            completedFiles.value.push(message.data)
            break
          case 'job-complete':
            jobResult.value = message.data
            progress.value = null
            break
          case 'error':
            error.value = message.data.message
            break
        }
      } catch (e) {
        console.error('Failed to parse WebSocket message:', e)
      }
    }
  }

  function disconnect() {
    if (reconnectTimeout) {
      clearTimeout(reconnectTimeout)
    }
    if (ws) {
      ws.close()
      ws = null
    }
  }

  function reset() {
    progress.value = null
    completedFiles.value = []
    jobResult.value = null
    error.value = null
  }

  onMounted(connect)
  onUnmounted(disconnect)

  return {
    connected,
    progress,
    completedFiles,
    jobResult,
    error,
    reset
  }
}

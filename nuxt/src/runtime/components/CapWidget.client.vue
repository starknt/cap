<script setup lang="ts">
import { useTemplateRef, watch, onBeforeMount, onBeforeUnmount } from 'vue'
import { widget as widgetUrl, wasm as wasmUrl } from '#build/cap.internal.widget.mjs'
import { useScript } from '#imports'

defineOptions({
  inheritAttrs: false,
})

useScript({
  src: widgetUrl,
}, {
  bundle: true,
})

const widget = useTemplateRef<HTMLElement>('widget')

const {
  apiEndpoint = '/api/',
  hiddenFieldName = 'cap-token',
  verifyingLabel = 'Verifying...',
  initialState = 'I\'m a human',
  solvedLabel = 'I\'m a human',
  errorLabel = 'Error',
  fetch: fetchFn,
  onSolve,
  onError,
  onReset,
  onProgress,
} = defineProps<{
  apiEndpoint?: string
  hiddenFieldName?: string
  verifyingLabel?: string
  initialState?: string
  solvedLabel?: string
  errorLabel?: string
  fetch?: typeof window.fetch
  onSolve?: (event: CustomEvent<{ token: string }>) => void
  onError?: (event: ErrorEvent) => void
  onReset?: () => void
  onProgress?: (event: ProgressEvent<EventTarget>) => void
}>()

onBeforeMount(() => {
  // set default fetch
  if (fetchFn) {
  // @ts-expect-error - window.CAP_CUSTOM_FETCH defined by cap.js/widget
    window.CAP_CUSTOM_FETCH = fetchFn
  }
  // @ts-expect-error - window.CAP_CUSTOM_WASM_URL defined by cap.js/widget
  window.CAP_CUSTOM_WASM_URL = wasmUrl
})

function handleSolve(event: Event) {
  onSolve?.(event as CustomEvent)
}

function handleError(event: ErrorEvent) {
  onError?.(event)
}

function handleReset() {
  onReset?.()
}

function handleProgress(event: ProgressEvent<EventTarget>) {
  onProgress?.(event)
}

watch(widget, (widget, _, onCleanup) => {
  if (!widget) {
    return
  }

  widget.addEventListener('solve', handleSolve)
  widget.addEventListener('error', handleError)
  widget.addEventListener('reset', handleReset)
  widget.addEventListener('progress', handleProgress)

  onCleanup(() => {
    widget.removeEventListener('solve', handleSolve)
    widget.removeEventListener('error', handleError)
    widget.removeEventListener('reset', handleReset)
    widget.removeEventListener('progress', handleProgress)
  })
}, { flush: 'post' })

onBeforeUnmount(() => {
  if (!widget.value) {
    return
  }

  widget.value.removeEventListener('solve', handleSolve)
  widget.value.removeEventListener('error', handleError)
  widget.value.removeEventListener('reset', handleReset)
  widget.value.removeEventListener('progress', handleProgress)
})
</script>

<template>
  <cap-widget
    ref="widget"
    :data-cap-api-endpoint="apiEndpoint"
    :data-cap-hidden-field-name="hiddenFieldName"
    :data-cap-i18n-verifying-label="verifyingLabel"
    :data-cap-i18n-initial-state="initialState"
    :data-cap-i18n-solved-label="solvedLabel"
    :data-cap-i18n-error-label="errorLabel"
  />
</template>

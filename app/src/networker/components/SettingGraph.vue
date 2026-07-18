<script setup lang="ts">
import Node from "@/networker/components/form/Node.vue";
import NodeLink from "@/networker/components/form/NodeLink.vue"
import FunctionalCircle from "@/networker/components/form/FunctionalCircle.vue";
import {computed, onBeforeUnmount, onMounted, ref} from "vue";
import Fact from "@/networker/components/form/Fact.vue";
import {Fact as EntityFact} from "@/networker/entity/graph/Fact"
import Tag from "@/networker/components/form/Tag.vue";
import PcmHint from "@/networker/components/form/PcmHint.vue";
import {Tag as EntityTag} from "@/networker/entity/graph/tag"
import {PcmTypeAiService} from "@/networker/service/ai/pcmTypeAiService";
import {usePremiumAccess} from '@/core/composable/access/premiumAccess'
import PremiumAccessButton from '@/components/monetisation/PremiumAccessButton.vue'
import {
  AiQueueSocketService,
  createSameOriginAiQueueEndpoint,
  type AiQueueStatus,
} from "@/networker/service/ai/queue/aiQueueSocketService";

const props = defineProps(['links', 'circle', 'graphService'])
const emit = defineEmits([
  'change', 'close',
  'removeNode',
  'changeLink', 'changeFact', 'changeTag',
])

const activeTab = ref(1)
const currentNode = ref<Node | undefined>(props.graphService.getCurrentNode())
props.graphService.cbActiveNode = (node: Node) => {
  currentNode.value = node
}

const aiService = new PcmTypeAiService()
const {isPremium} = usePremiumAccess()
const aiText = ref('')
const aiSummary = ref('')
const isAiLoading = ref(false)
const isTranscribing = ref(false)
const transcriptionError = ref('')
const transcriptionInterimText = ref('')
const aiCooldownSeconds = ref(0)
const currentAiRequestId = ref('')
const aiQueueStatus = ref<AiQueueStatus>({
  connected: false,
  queueLength: 0,
  activeRequestId: null,
  currentRequestPosition: null,
  retryAfterSeconds: 0,
  updatedAt: 0,
})
const aiClientId = createAiRequestId()
const aiQueueSocket = new AiQueueSocketService(
  import.meta.env.VITE_AI_QUEUE_WS_ENDPOINT ?? createSameOriginAiQueueEndpoint(),
  aiClientId,
)
let unsubscribeAiQueue: (() => void) | undefined
let aiCooldownTimer: number | undefined
let speechRecognition: any


const setActiveTab = (idx: number): void => {
  activeTab.value = idx
}

const filterClass = (item: Node): string => {
  return item.pcm?.filter.class ?? ''
}

const change = (): void => {
  emit('change')
}

const removeNode = (): void => {
  activeTab.value = 0
  emit('removeNode')
}

const addLink = (node): void => {
  props.graphService.addLink(node);
  emit('changeLink', node)
}

const removeLink = (link): void => {
  props.graphService.removeLink(link);
  emit('changeLink', link)
}

const addFact = (description: string): void => {
  const fact = props.graphService.addFact(currentNode.value)
  fact.description = description
  emit('changeFact')
}

const removeFact = (fact: EntityFact): void => {
  props.graphService.removeFact(currentNode.value, fact)
  emit('changeFact')
}

const bindTag = (tag: EntityTag): void => {
  props.graphService.bindTag(tag, currentNode.value)
  emit('changeTag')
}

const unbindTag = (tag: EntityTag): void => {
  props.graphService.unbindTag(tag, currentNode.value)
  emit('changeTag')
}

const close = (): void => {
  currentNode.value = undefined
  emit('close')
}

const isAiSubmitDisabled = computed((): boolean => {
  return !isPremium.value || !aiText.value.trim() || isAiLoading.value || aiCooldownSeconds.value > 0
})

const speechRecognitionConstructor = computed((): any => {
  if (typeof window === 'undefined') {
    return undefined
  }

  return (window as any).SpeechRecognition ?? (window as any).webkitSpeechRecognition
})

const isTranscriptionSupported = computed((): boolean => Boolean(speechRecognitionConstructor.value))

const aiQueuePosition = computed((): number | null => {
  return aiQueueStatus.value.currentRequestPosition
})

const aiQueueConnectionTitle = computed((): string => {
  return aiQueueStatus.value.connected ? 'Очередь подключена' : 'Очередь недоступна'
})

const aiQueueLabel = computed((): string => {
  const position = aiQueuePosition.value ? ` / позиция ${aiQueuePosition.value}` : ''
  return `Очередь ${aiQueueStatus.value.queueLength}${position}`
})

function createAiRequestId(): string {
  if (typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID()
  }

  return `${Date.now()}-${Math.random().toString(16).slice(2)}`
}

const startAiCooldown = (seconds = 60): void => {
  aiCooldownSeconds.value = seconds

  if (aiCooldownTimer) {
    window.clearInterval(aiCooldownTimer)
  }

  aiCooldownTimer = window.setInterval(() => {
    aiCooldownSeconds.value = Math.max(0, aiCooldownSeconds.value - 1)

    if (aiCooldownSeconds.value === 0 && aiCooldownTimer) {
      window.clearInterval(aiCooldownTimer)
      aiCooldownTimer = undefined
    }
  }, 1000)
}

const detectPcmType = async (): Promise<void> => {
  if (!isPremium.value || isAiSubmitDisabled.value) {
    return
  }

  isAiLoading.value = true
  aiSummary.value = ''
  currentAiRequestId.value = createAiRequestId()
  aiQueueSocket.setCurrentRequestId(currentAiRequestId.value)
  aiQueueSocket.requestStatus()

  try {
    aiSummary.value = await aiService.detectType(aiText.value, currentAiRequestId.value, aiClientId)
  } catch (error) {
    aiSummary.value = error instanceof Error ? error.message : 'Не удалось получить резюме от ИИ.'
  } finally {
    isAiLoading.value = false
    startAiCooldown()
    aiQueueSocket.requestStatus()
  }
}

const clearAiForm = (): void => {
  aiText.value = ''
  aiSummary.value = ''
  transcriptionError.value = ''
  transcriptionInterimText.value = ''
  currentAiRequestId.value = ''
  aiQueueSocket.setCurrentRequestId('')
  aiQueueSocket.requestStatus()
}

const appendTranscribedText = (text: string): void => {
  const value = text.trim()
  if (!value) {
    return
  }

  aiText.value = `${aiText.value.trim()} ${value}`.trim()
}

const startTranscription = (): void => {
  if (!isTranscriptionSupported.value || isTranscribing.value) {
    return
  }

  transcriptionError.value = ''
  transcriptionInterimText.value = ''
  speechRecognition = new speechRecognitionConstructor.value()
  speechRecognition.lang = 'ru-RU'
  speechRecognition.continuous = true
  speechRecognition.interimResults = true

  speechRecognition.onresult = (event: any): void => {
    let finalText = ''
    let interimText = ''

    for (let index = event.resultIndex; index < event.results.length; index += 1) {
      const transcript = event.results[index][0]?.transcript ?? ''

      if (event.results[index].isFinal) {
        finalText += transcript
      } else {
        interimText += transcript
      }
    }

    appendTranscribedText(finalText)
    transcriptionInterimText.value = interimText.trim()
  }

  speechRecognition.onerror = (event: any): void => {
    transcriptionError.value = event?.error ? `Ошибка транскрибации: ${event.error}` : 'Ошибка транскрибации.'
    isTranscribing.value = false
  }

  speechRecognition.onend = (): void => {
    isTranscribing.value = false
    transcriptionInterimText.value = ''
  }

  isTranscribing.value = true
  speechRecognition.start()
}

const stopTranscription = (): void => {
  isTranscribing.value = false
  speechRecognition?.stop()
}

onMounted(() => {
  unsubscribeAiQueue = aiQueueSocket.subscribe((status) => {
    aiQueueStatus.value = status
  })
  aiQueueSocket.connect()
})

onBeforeUnmount(() => {
  stopTranscription()

  if (aiCooldownTimer) {
    window.clearInterval(aiCooldownTimer)
  }

  unsubscribeAiQueue?.()
  aiQueueSocket.disconnect()
})

</script>

<template lang="pug">
  aside.panel(v-if="currentNode" :class="filterClass(currentNode)")
    .panel-heading {{ currentNode.getName() }}
      button.button.is-pulled-right(@click="close")
        i.fa.fa-close
    .panel-tabs
      a(:class="{'is-active': activeTab === 1}" @click="setActiveTab(1)")
        i.fa.fa-user
      a(:class="{'is-active': activeTab === 2}" @click="setActiveTab(2)")
        i.fa.fa-link
      a(:class="{'is-active': activeTab === 3}" @click="setActiveTab(3)")
        i.fa.fa-file
      a(:class="{'is-active': activeTab === 4}" @click="setActiveTab(4)")
        i.fa.fa-tag
      a(:class="{'is-active': activeTab === 5}" @click="setActiveTab(5)")
        i.fa.fa-compass
      a(:class="{'is-active': activeTab === 6}" @click="setActiveTab(6)")
        i.fa.fa-wand-magic-sparkles
      a(:class="{'is-active': activeTab === 7}" @click="setActiveTab(7)")
        i.fa.fa-circle-nodes

    .panel-block(v-if="activeTab === 1")
      Node(
        :node="currentNode"
        @change="change"
        @remove="removeNode"
      )

    .panel-block(v-if="activeTab === 2")
      NodeLink(
        :node="currentNode"
        :nodes="props.graphService.nodes"
        :links="props.links"
        @change="change"
        @add="addLink"
        @remove="removeLink"
      )

    .panel-block(v-if="activeTab === 3")
      Fact(
        :node="currentNode"
        @add="addFact"
        @remove="removeFact"
      )

    .panel-block(v-if="activeTab === 4")
      Tag(
        :node="currentNode"
        :tags="props.graphService.tags"
        @bindTag="bindTag"
        @unbindTag="unbindTag"
      )

    .panel-block(v-if="activeTab === 5")
      PcmHint(
        :node="currentNode"
        @change="change"
      )

    .panel-block(v-if="activeTab === 6")
      .ai-type-tool
        .notification.is-warning.is-light.ai-premium-note(v-if="!isPremium")
          span.icon
            i.fa.fa-crown
          div
            strong AI-анализ доступен в Premium
            p Активируйте доступ для текущей сессии, чтобы анализировать текст и получать PCM-подсказки.
            PremiumAccessButton
        .field
          .ai-text-header
            label.label Текст для анализа
            .ai-queue-status
              span.icon.ai-queue-connection(
                :class="aiQueueStatus.connected ? 'has-text-success' : 'has-text-warning'"
                :title="aiQueueConnectionTitle"
              )
                i.fa(:class="aiQueueStatus.connected ? 'fa-link' : 'fa-link-slash'")
              span.tag.is-light(:title="aiQueueConnectionTitle") {{ aiQueueLabel }}
              span.tag.is-warning.is-light(v-if="aiQueueStatus.retryAfterSeconds > 0")
                | {{ aiQueueStatus.retryAfterSeconds }} с
          .control
            textarea.textarea(
              v-model="aiText"
              rows="7"
              placeholder="Вставьте фрагмент речи, переписки или заметки контакта"
              :disabled="!isPremium"
            )
          .transcription-tools
            span.help(v-if="!isTranscriptionSupported") Браузер не поддерживает транскрибацию.
            span.help.has-text-info(v-if="transcriptionInterimText") {{ transcriptionInterimText }}
            span.help.is-danger(v-if="transcriptionError") {{ transcriptionError }}
        .field
          .control.ai-action-buttons
            button.button(
              type="button"
              :class="isTranscribing ? 'is-danger' : 'is-light'"
              :disabled="!isPremium || !isTranscriptionSupported"
              :title="isTranscribing ? 'Остановить транскрибацию' : 'Начать транскрибацию'"
              @click="isTranscribing ? stopTranscription() : startTranscription()"
            )
              span.icon
                i.fa(:class="isTranscribing ? 'fa-stop' : 'fa-microphone'")
              span Голосовой набор
            button.button.is-info.is-fullwidth(
              type="button"
              :class="{'is-loading': isAiLoading}"
              :disabled="isAiSubmitDisabled"
              @click="detectPcmType"
            )
              span.icon
                i.fa.fa-paper-plane
              span(v-if="aiCooldownSeconds === 0") Отправить
              span(v-else) Подождите {{ aiCooldownSeconds }} с
            button.button.is-light(
              type="button"
              title="Очистить форму"
              :disabled="isAiLoading && !aiText && !aiSummary"
              @click="clearAiForm"
            )
              span.icon
                i.fa.fa-eraser
        p.help.is-warning(v-if="aiCooldownSeconds > 0")
          | Следующий запрос будет доступен через {{ aiCooldownSeconds }} с.
        .content.ai-summary(v-if="aiSummary")
          p.has-text-weight-semibold Резюме от ИИ
          pre {{ aiSummary }}

    .panel-block(v-if="activeTab === 7")
      FunctionalCircle(
        :node="currentNode"
        :graph-service="props.graphService"
        @change="change"
      )

</template>

<style scoped>
.ai-type-tool {
  width: 100%;
  min-width: 0;
}

.ai-premium-note {
  display: flex;
  align-items: flex-start;
  gap: 0.55rem;
  margin-bottom: 0.85rem;
}

.ai-premium-note > .icon {
  color: #b77900;
}

.ai-premium-note strong, .ai-premium-note p {
  display: block;
}

.ai-premium-note p {
  margin: 0.2rem 0 0.55rem;
  font-size: 0.82rem;
  line-height: 1.35;
}

.ai-queue-status {
  display: flex;
  flex-wrap: wrap;
  justify-content: flex-end;
  gap: 0.35rem;
  min-width: 0;
}

.ai-queue-status .tag {
  max-width: 100%;
  white-space: normal;
  height: auto;
  min-height: 2em;
}

.ai-text-header {
  display: grid;
  grid-template-columns: 1fr auto;
  align-items: center;
  gap: 0.75rem;
  margin-bottom: 0.5rem;
}

.ai-text-header .label {
  margin-bottom: 0;
}

.ai-action-buttons {
  display: grid;
  grid-template-columns: auto 1fr auto;
  gap: 0.5rem;
}

.ai-action-buttons .button {
  min-width: 0;
}

.transcription-tools {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 0.5rem;
  margin-top: 0.5rem;
}

@media screen and (max-width: 520px) {
  .ai-text-header {
    grid-template-columns: 1fr;
    gap: 0.35rem;
  }

  .ai-queue-status {
    justify-content: flex-start;
  }

  .ai-action-buttons {
    grid-template-columns: 1fr auto;
  }

  .ai-action-buttons .button.is-info {
    grid-column: 1 / -1;
    grid-row: 2;
  }

  .ai-action-buttons .button:not(.is-info) {
    grid-row: 1;
  }

  .ai-action-buttons .button span:not(.icon) {
    white-space: normal;
  }

  .ai-type-tool .textarea {
    min-height: 9rem;
  }

  .panel-block {
    padding-left: 0.5rem;
    padding-right: 0.5rem;
  }
}

.ai-summary {
  margin-top: 1rem;
}

.ai-summary pre {
  white-space: pre-wrap;
}
</style>

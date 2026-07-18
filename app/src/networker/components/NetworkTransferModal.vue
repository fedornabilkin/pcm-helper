<script setup lang="ts">
import {computed, ref, watch} from "vue";
import type {GraphService} from "@/networker/service/graphService";
import {
  GraphImportService,
  type ImportAnalysis,
  type ImportCandidate,
  type ImportCandidateStatus,
  type ImportLinkCandidate,
  type ImportLinkCandidateStatus,
  type ImportLinkDecision,
  type LinkMergeField,
  type ImportNodeDecision,
  type ImportPlan,
  type NodeMergeField,
} from "@/networker/service/import/graphImportService";
import {ImportRevisionService} from "@/networker/service/import/importRevisionService";
import {JsonFileAdapter} from "@/networker/service/transfer/fileAdapter";
import type {ParsedNetworkFile} from "@/networker/service/transfer/networkFile";
import type {GraphLinkDTO} from "@/networker/graph/types";
import {validateNetworkGraph} from "@/networker/service/transfer/networkFile";
import packageJson from "../../../package.json";
import {usePremiumAccess} from '@/core/composable/access/premiumAccess'
import PremiumAccessButton from '@/components/monetisation/PremiumAccessButton.vue'

const props = defineProps<{
  graphService: GraphService;
  networkId: number;
  networkName: string;
}>()

const emit = defineEmits<{
  close: [];
  imported: [plan: ImportPlan];
}>()

type ImportMode = 'replace' | 'merge'
type TransferPhase = 'select' | 'preview' | 'result'

const importService = new GraphImportService()
const {isPremium} = usePremiumAccess()
const importFileInput = ref<HTMLInputElement | null>(null)
const importMode = ref<ImportMode>(isPremium.value ? 'merge' : 'replace')
const phase = ref<TransferPhase>('select')
const parsedFile = ref<ParsedNetworkFile | null>(null)
const analysis = ref<ImportAnalysis | null>(null)
const decisions = ref<Record<string, ImportNodeDecision>>({})
const linkDecisions = ref<Record<string, ImportLinkDecision>>({})
const importSearch = ref('')
const statusFilter = ref<ImportCandidateStatus | 'all'>('all')
const errorMessage = ref('')
const resultPlan = ref<ImportPlan | null>(null)

watch(isPremium, (premium): void => {
  if (!premium && importMode.value === 'merge') {
    importMode.value = 'replace'
  }
})

const statusLabels: Record<ImportCandidateStatus, string> = {
  new: 'Новый',
  unchanged: 'Без изменений',
  changed: 'Изменён',
  conflict: 'Конфликт',
  'possible-duplicate': 'Возможный дубль',
}

const statusClasses: Record<ImportCandidateStatus, string> = {
  new: 'is-success',
  unchanged: 'is-light',
  changed: 'is-info',
  conflict: 'is-danger',
  'possible-duplicate': 'is-warning',
}

const linkStatusLabels: Record<ImportLinkCandidateStatus, string> = {
  new: 'Новая',
  unchanged: 'Без изменений',
  changed: 'Изменена',
  conflict: 'Конфликт',
  'local-only': 'Только в текущей',
  'removed-in-file': 'Удалена в файле',
}

const linkStatusClasses: Record<ImportLinkCandidateStatus, string> = {
  new: 'is-success',
  unchanged: 'is-light',
  changed: 'is-info',
  conflict: 'is-danger',
  'local-only': 'is-light',
  'removed-in-file': 'is-warning',
}

const linkFieldLabels: Record<LinkMergeField, string> = {
  distance: 'длина',
  status: 'статус',
  stroke: 'цвет',
  strokeWidth: 'толщина',
}

const currentNetworkSummary = computed(() => {
  const graph = props.graphService.toDTO()
  return {
    nodes: graph.nodes.length,
    links: graph.links.length,
  }
})

const unresolvedConflictCount = computed((): number => {
  if (!analysis.value) {
    return 0
  }
  return analysis.value.candidates.filter(candidate => candidate.status === 'conflict').length
    + analysis.value.linkCandidates.filter(candidate => candidate.status === 'conflict').length
})

const fieldLabels: Record<NodeMergeField, string> = {
  name: 'Имя',
  description: 'Описание',
  nodeType: 'Тип контакта',
  tags: 'Теги',
  pcm: 'PCM',
  pcmHint: 'PCM-гипотеза',
  fill: 'Цвет',
  stroke: 'Обводка',
  strokeWidth: 'Толщина обводки',
  fixed: 'Фиксация',
  position: 'Позиция',
}

const getFieldValue = (node: ImportCandidate['incoming'] | undefined, field: NodeMergeField): string => {
  if (!node) {
    return '—'
  }

  if (field === 'tags') {
    return `${node.tags?.length ?? 0} тег.`
  }
  if (field === 'pcm') {
    return node.pcm?.filter?.label ?? node.pcm?.filter?.name ?? 'Не задан'
  }
  if (field === 'pcmHint') {
    const hint = node.pcmHint
    if (!hint?.filter) {
      return 'Не задана'
    }
    return `${hint.filter} · ${hint.confidence === 'high' ? 'высокая' : hint.confidence === 'medium' ? 'средняя' : 'низкая'} уверенность`
  }
  if (field === 'position') {
    return `x: ${Math.round(node.x ?? 0)}, y: ${Math.round(node.y ?? 0)}`
  }
  if (field === 'fixed') {
    return node.fixed ? 'Зафиксирован' : 'Не зафиксирован'
  }

  const value = node[field]
  if (value === undefined || value === null || value === '') {
    return 'Не задано'
  }
  return String(value)
}

const filteredCandidates = computed((): ImportCandidate[] => {
  const query = importSearch.value.trim().toLocaleLowerCase('ru-RU')
  return (analysis.value?.candidates ?? []).filter(candidate => {
    const matchesStatus = statusFilter.value === 'all' || candidate.status === statusFilter.value
    const matchesSearch = !query
      || `${candidate.incoming.name ?? ''} ${candidate.incoming.description ?? ''}`
        .toLocaleLowerCase('ru-RU')
        .includes(query)
    return matchesStatus && matchesSearch
  })
})

const hasMergeSelection = computed((): boolean => {
  const hasNodeChange = (analysis.value?.candidates ?? []).some(candidate => {
    const decision = decisions.value[candidate.key]
    if (!decision?.selected) {
      return false
    }
    if (!candidate.local) {
      return true
    }
    return Object.values(decision.fieldResolutions ?? {}).some(side => side === 'incoming')
  })
  const hasLinkChange = Object.values(linkDecisions.value).some(decision => {
    return decision.side === 'incoming'
  })
  return hasNodeChange || hasLinkChange
})

const differentLinks = computed(() => {
  return analysis.value?.linkCandidates.filter(candidate => {
    return candidate.status !== 'unchanged' && candidate.incoming !== undefined
  }) ?? []
})

const linkEndpointId = (endpoint: GraphLinkDTO['source']): number | undefined => {
  return typeof endpoint === 'number' ? endpoint : endpoint?.id
}

const nodeLinkDifferences = (candidate: ImportCandidate): ImportLinkCandidate[] => {
  return differentLinks.value.filter(linkCandidate => {
    if (linkCandidate.incoming) {
      return linkEndpointId(linkCandidate.incoming.source) === candidate.incoming.id
    }
    return Boolean(
      linkCandidate.local
      && candidate.local
      && linkEndpointId(linkCandidate.local.source) === candidate.local.id,
    )
  })
}

const mergeCandidates = computed(() => {
  return filteredCandidates.value.filter(candidate => {
    return candidate.status !== 'unchanged' || nodeLinkDifferences(candidate).length > 0
  })
})

const groupedLinkKeys = computed(() => {
  return new Set((analysis.value?.candidates ?? []).flatMap(candidate => {
    return nodeLinkDifferences(candidate).map(link => link.key)
  }))
})

const ungroupedLinks = computed(() => {
  return differentLinks.value.filter(candidate => !groupedLinkKeys.value.has(candidate.key))
})

const getLinkValue = (link: GraphLinkDTO | undefined): string => {
  if (!link) {
    return 'Связи нет'
  }

  const details = [
    link.distance !== undefined ? `длина ${link.distance}` : '',
    link.status !== undefined ? (link.status ? 'активна' : 'неактивна') : '',
    link.stroke ? `цвет ${link.stroke}` : '',
    link.strokeWidth !== undefined ? `толщина ${link.strokeWidth}` : '',
  ].filter(Boolean)
  return details.length ? details.join(' · ') : 'Связь есть'
}

const toggleFieldResolution = (
  candidateKey: string,
  field: NodeMergeField,
  side: 'local' | 'incoming',
): void => {
  const decision = decisions.value[candidateKey]
  if (!decision?.fieldResolutions) {
    return
  }
  decision.fieldResolutions[field] = decision.fieldResolutions[field] === side ? 'none' : side
}

const toggleLinkResolution = (candidateKey: string, side: 'local' | 'incoming'): void => {
  const decision = linkDecisions.value[candidateKey]
  if (!decision) {
    return
  }
  decision.side = decision.side === side ? 'none' : side
}

const toggleNewCandidate = (candidateKey: string): void => {
  const decision = decisions.value[candidateKey]
  if (decision) {
    decision.selected = !decision.selected
    if (!decision.selected) {
      const candidate = analysis.value?.candidates.find(item => item.key === candidateKey)
      candidate && nodeLinkDifferences(candidate).forEach(link => {
        linkDecisions.value[link.key].side = 'none'
      })
    }
  }
}

const getResolvedFieldValue = (candidate: ImportCandidate, field: NodeMergeField): string => {
  const side = decisions.value[candidate.key]?.fieldResolutions?.[field]
  if (side === 'local') {
    return getFieldValue(candidate.local, field)
  }
  if (side === 'incoming') {
    return getFieldValue(candidate.incoming, field)
  }
  return 'Не выбрано'
}

const getResolvedLinkValue = (candidate: ImportLinkCandidate): string => {
  const side = linkDecisions.value[candidate.key]?.side
  if (side === 'local') {
    return getLinkValue(candidate.local)
  }
  if (side === 'incoming') {
    return getLinkValue(candidate.incoming)
  }
  return 'Не выбрано'
}

const getOtherNodeName = (
  linkCandidate: ImportLinkCandidate,
  nodeCandidate: ImportCandidate,
): string => {
  const currentName = nodeCandidate.incoming.name ?? nodeCandidate.local?.name ?? ''
  return linkCandidate.sourceName === currentName
    ? linkCandidate.targetName
    : linkCandidate.sourceName
}

const previewPlan = computed((): ImportPlan | null => {
  if (!analysis.value) {
    return null
  }

  return importMode.value === 'replace'
    ? importService.createReplacePlan(analysis.value)
    : importService.createMergePlan(
      analysis.value,
      Object.values(decisions.value),
      Object.values(linkDecisions.value),
    )
})

const formatExportFileDateTime = (date: Date): string => {
  const pad = (value: number): string => String(value).padStart(2, '0')
  return [
    date.getFullYear(),
    pad(date.getMonth() + 1),
    pad(date.getDate()),
  ].join('-') + '_' + [
    pad(date.getHours()),
    pad(date.getMinutes()),
    pad(date.getSeconds()),
  ].join('-')
}

const exportNetworkFile = (): void => {
  const exportedAt = new Date()
  const revisionService = new ImportRevisionService(props.networkId)
  const revision = revisionService.prepareExport(props.graphService.toDTO())

  props.graphService.setFileAdapter(new JsonFileAdapter({
    ...revision.meta,
    version: packageJson.version,
    exportedAt: exportedAt.toISOString(),
    exportedAtReadable: exportedAt.toLocaleString('ru-RU'),
    networkName: props.networkName,
  }, revision.base))

  const dataUri = "data:text/json;charset=utf-8," + encodeURIComponent(props.graphService.export())
  const anchorElement = document.createElement('a')
  anchorElement.href = dataUri
  anchorElement.download = `pcm-helper-${formatExportFileDateTime(exportedAt)}.json`
  document.body.appendChild(anchorElement)
  anchorElement.click()
  document.body.removeChild(anchorElement)
  emit('close')
}

const selectImportFile = (): void => {
  errorMessage.value = ''
  importFileInput.value?.click()
}

const initializeDecisions = (value: ImportAnalysis): void => {
  decisions.value = Object.fromEntries(value.candidates.map(candidate => {
    const selected = candidate.status !== 'unchanged'
    const fieldResolutions = Object.fromEntries(candidate.changedFields.map(field => [
      field,
      candidate.recommendedResolutions[field] ?? 'local',
    ])) as ImportNodeDecision['fieldResolutions']

    return [candidate.key, {key: candidate.key, selected, fieldResolutions}]
  }))
  linkDecisions.value = Object.fromEntries(value.linkCandidates.map(candidate => [
    candidate.key,
    {key: candidate.key, side: candidate.recommendedResolution},
  ]))
}

const importNetworkFile = (event: Event): void => {
  const input = event.target as HTMLInputElement
  const file = input.files?.[0]
  if (!file) {
    return
  }

  const reader = new FileReader()
  reader.onload = (): void => {
    try {
      if (typeof reader.result !== 'string') {
        throw new Error('Файл должен быть текстовым JSON-файлом.')
      }

      const parsed = new JsonFileAdapter().read(reader.result)
      const nextAnalysis = importService.analyze(
        props.graphService.toDTO(),
        parsed.payload,
        parsed.base,
      )
      parsedFile.value = parsed
      analysis.value = nextAnalysis
      initializeDecisions(nextAnalysis)
      phase.value = 'preview'
      errorMessage.value = ''
    } catch (error) {
      errorMessage.value = error instanceof Error ? error.message : 'Не удалось прочитать файл.'
    } finally {
      input.value = ''
    }
  }
  reader.onerror = (): void => {
    errorMessage.value = 'Не удалось прочитать выбранный файл.'
    input.value = ''
  }
  reader.readAsText(file)
}

const selectRelatedContacts = (): void => {
  if (!analysis.value) {
    return
  }

  let changed = true
  while (changed) {
    changed = false
    const selectedIds = new Set(analysis.value.candidates
      .filter(candidate => decisions.value[candidate.key].selected)
      .map(candidate => candidate.incoming.id)
      .filter((id): id is number => id !== undefined))

    analysis.value.incoming.links.forEach(link => {
      const source = typeof link.source === 'number' ? link.source : link.source.id
      const target = typeof link.target === 'number' ? link.target : link.target.id
      if (!source || !target || (!selectedIds.has(source) && !selectedIds.has(target))) {
        return
      }

      analysis.value?.candidates.forEach(candidate => {
        if (
          (candidate.incoming.id === source || candidate.incoming.id === target)
          && !decisions.value[candidate.key].selected
        ) {
          decisions.value[candidate.key].selected = true
          changed = true
        }
      })
    })
  }
}

const backToSelect = (): void => {
  phase.value = 'select'
  parsedFile.value = null
  analysis.value = null
  decisions.value = {}
  linkDecisions.value = {}
  errorMessage.value = ''
}

const saveBackup = (): void => {
  localStorage.setItem(`${props.networkId}-graph_importBackup`, JSON.stringify({
    createdAt: new Date().toISOString(),
    payload: props.graphService.toDTO(),
  }))
}

const applyImport = (): void => {
  if (!analysis.value || !parsedFile.value) {
    return
  }

  try {
    const plan = importMode.value === 'replace'
      ? importService.createReplacePlan(analysis.value)
      : importService.createMergePlan(
        analysis.value,
        Object.values(decisions.value),
        Object.values(linkDecisions.value),
      )

    saveBackup()
    plan.result = validateNetworkGraph(plan.result)
    props.graphService.applyDTOAtomic(plan.result)
    new ImportRevisionService(props.networkId).recordImport(
      plan.result,
      parsedFile.value.meta,
      importMode.value === 'replace',
    )
    resultPlan.value = plan
    phase.value = 'result'
    errorMessage.value = ''
    emit('imported', plan)
  } catch (error) {
    errorMessage.value = error instanceof Error ? error.message : 'Не удалось применить импорт.'
  }
}

const close = (): void => emit('close')
</script>

<template lang="pug">
.modal.is-active
  .modal-background(@click="close")
  .modal-card.transfer-modal
    header.modal-card-head.transfer-modal-head
      .transfer-head-content
        p.modal-card-title Импорт и экспорт сети
        p.transfer-current-network
          strong {{ networkName }}
          span
            | {{ currentNetworkSummary.nodes }} контактов ·
            | {{ currentNetworkSummary.links }} связей
      .transfer-head-actions
        span.tag(:class="importMode === 'replace' ? 'is-warning' : 'is-info'")
          | {{ importMode === 'replace' ? 'Замена' : 'Объединение' }}
        button.delete(type="button" aria-label="Закрыть" @click="close")

    template(v-if="phase === 'select'")
      section.modal-card-body
        .columns.transfer-columns
          .column.transfer-column
            h3.title.is-5 Экспорт
            p Сохранит текущую сеть, метаданные ревизии, дату и время создания.
          .column.transfer-column
            h3.title.is-5 Импорт
            .field
              label.radio.mr-4
                input.mr-1(v-model="importMode" type="radio" value="replace")
                | Заменить
              label.radio(:class="{'has-text-grey-light': !isPremium}")
                input.mr-1(v-model="importMode" type="radio" value="merge" :disabled="!isPremium")
                | Объединить
            p(v-if="importMode === 'replace'") Полностью заменит данные текущей сети.
            p(v-else) Позволит выбрать контакты и разрешить конфликты.
            .notification.is-warning.is-light.import-premium-note(v-if="!isPremium")
              span.icon
                i.fa.fa-crown
              div
                strong Выборочное объединение доступно в Premium
                p Базовый доступ сохраняет безопасный импорт с полной заменой сети.
                PremiumAccessButton
            .notification.is-warning.is-light.import-warning(v-if="importMode === 'replace'")
              strong Важно:
              |  текущие данные будут заменены. Перед применением сохранится локальная резервная копия.
            input.is-hidden(
              ref="importFileInput"
              type="file"
              accept="application/json,.json"
              @change="importNetworkFile"
            )
        .notification.is-danger.is-light(v-if="errorMessage") {{ errorMessage }}
      footer.modal-card-foot.transfer-modal-actions
        button.button.is-info(type="button" @click="exportNetworkFile")
          span.icon
            i.fa.fa-file-export
          span Экспорт
        button.button.is-warning.import-action(type="button" @click="selectImportFile")
          span.icon
            i.fa.fa-file-import
          span Выбрать файл

    template(v-else-if="phase === 'preview' && analysis")
      section.modal-card-body.import-preview
        .level.is-mobile.import-file-summary
          .level-left
            .level-item
              div
                p.has-text-weight-semibold {{ parsedFile?.meta.networkName || 'Импортируемая сеть' }}
                p.help
                  span(v-if="parsedFile?.isLegacy") Старый формат ·
                  |  {{ analysis.counts.nodes }} контактов, {{ analysis.counts.links }} связей,
                  |  {{ analysis.counts.tags }} тегов
        .import-guidance(v-if="importMode === 'merge' || parsedFile?.warnings.length || unresolvedConflictCount")
          p.import-guidance-text(v-if="importMode === 'merge'")
            | Нажмите вариант слева или справа, чтобы поместить его в результат.
            |  Повторное нажатие снимает выбор.
          .import-guidance-conflicts(
            v-if="parsedFile?.warnings.length || unresolvedConflictCount"
          )
            span(v-if="parsedFile?.warnings.length")
              i.fa.fa-wand-magic-sparkles
              | Некоторые конфликты исправлены автоматически
            span.has-text-danger(v-if="unresolvedConflictCount")
              i.fa.fa-triangle-exclamation
              | Требуют решения: {{ unresolvedConflictCount }}

        template(v-if="importMode === 'replace'")
          .notification.is-danger.is-light
            strong Текущая сеть будет заменена.
            br
            | После проверки файла будут заменены контакты, связи, теги и функциональные круги.

        template(v-else)
          .field.has-addons.import-toolbar
            .control.is-expanded.has-icons-left
              input.input.is-small(
                v-model="importSearch"
                type="search"
                placeholder="Поиск импортируемых контактов"
              )
              span.icon.is-small.is-left
                i.fa.fa-magnifying-glass
            .control
              .select.is-small
                select(v-model="statusFilter" aria-label="Фильтр статуса")
                  option(value="all") Все статусы
                  option(value="new") Новые
                  option(value="changed") Изменённые
                  option(value="conflict") Конфликты
                  option(value="possible-duplicate") Возможные дубли
                  option(value="unchanged") Без изменений

          .notification.is-warning.is-light(v-if="analysis.remoteDeletions.length")
            strong В файле отсутствуют контакты из общей базовой версии: {{ analysis.remoteDeletions.length }}.
            br
            | При объединении локальные контакты сохранятся.
            span(v-if="analysis.remoteDeletions.some(item => item.conflict)")
              |  Среди них есть изменённые локально — удаление распознано как конфликт.

          .import-main-merge
            .import-main-head
              span Сейчас
              span Итоговый результат
              span Файл

            article.import-node-group(v-for="candidate in mergeCandidates" :key="candidate.key")
              .import-node-title
                div
                  strong {{ candidate.incoming.name || candidate.local?.name || `Контакт ${candidate.incoming.id}` }}
                  span.tag.ml-2(:class="statusClasses[candidate.status]")
                    | {{ statusLabels[candidate.status] }}
                span.help
                  | {{ candidate.changedFields.length }} изменений ·
                  | {{ nodeLinkDifferences(candidate).length }} связей

              .import-difference-row(v-if="!candidate.local")
                .import-difference-name Контакт
                .import-three-columns
                  .import-merge-cell.is-empty Нет контакта
                  .import-merge-cell.import-result-cell(
                    :class="{ 'has-result': decisions[candidate.key].selected }"
                  )
                    | {{ decisions[candidate.key].selected ? 'Добавить контакт' : 'Не выбрано' }}
                  button.import-merge-cell.import-choice-cell(
                    type="button"
                    :class="{ 'is-selected': decisions[candidate.key].selected }"
                    @click="toggleNewCandidate(candidate.key)"
                  ) {{ candidate.incoming.name || 'Новый контакт' }}

              .import-difference-row(
                v-for="field in candidate.local ? candidate.changedFields : []"
                :key="field"
              )
                .import-difference-name
                  | {{ fieldLabels[field] }}
                  span.tag.is-danger.is-light.ml-2(v-if="candidate.conflictFields.includes(field)")
                    | Конфликт
                .import-three-columns
                  button.import-merge-cell.import-choice-cell(
                    type="button"
                    :disabled="!candidate.local"
                    :class="{ 'is-selected': decisions[candidate.key].fieldResolutions[field] === 'local' }"
                    @click="toggleFieldResolution(candidate.key, field, 'local')"
                  ) {{ getFieldValue(candidate.local, field) }}
                  .import-merge-cell.import-result-cell(
                    :class="{ 'has-result': decisions[candidate.key].fieldResolutions[field] !== 'none' }"
                  ) {{ getResolvedFieldValue(candidate, field) }}
                  button.import-merge-cell.import-choice-cell(
                    type="button"
                    :class="{ 'is-selected': decisions[candidate.key].fieldResolutions[field] === 'incoming' }"
                    @click="toggleFieldResolution(candidate.key, field, 'incoming')"
                  ) {{ getFieldValue(candidate.incoming, field) }}

              .import-node-links(v-if="nodeLinkDifferences(candidate).length")
                .import-subsection-title Связи
                .import-difference-row(
                  v-for="linkCandidate in nodeLinkDifferences(candidate)"
                  :key="linkCandidate.key"
                )
                  .import-difference-name
                    | С {{ getOtherNodeName(linkCandidate, candidate) }}
                    span.tag.ml-2(:class="linkStatusClasses[linkCandidate.status]")
                      | {{ linkStatusLabels[linkCandidate.status] }}
                    span.tag.is-danger.is-light.ml-1(v-if="linkCandidate.conflictFields.length")
                      | Конфликт
                  .import-three-columns
                    button.import-merge-cell.import-choice-cell(
                      type="button"
                      :disabled="!linkCandidate.incoming"
                      :class="{ 'is-selected': linkDecisions[linkCandidate.key].side === 'local' }"
                      @click="toggleLinkResolution(linkCandidate.key, 'local')"
                    ) {{ getLinkValue(linkCandidate.local) }}
                    .import-merge-cell.import-result-cell(
                      :class="{ 'has-result': linkDecisions[linkCandidate.key].side !== 'none' }"
                    ) {{ getResolvedLinkValue(linkCandidate) }}
                    button.import-merge-cell.import-choice-cell(
                      type="button"
                      :disabled="!linkCandidate.incoming"
                      :class="{ 'is-selected': linkDecisions[linkCandidate.key].side === 'incoming' }"
                      @click="toggleLinkResolution(linkCandidate.key, 'incoming')"
                    ) {{ getLinkValue(linkCandidate.incoming) }}

            article.import-node-group(v-if="ungroupedLinks.length")
              .import-node-title
                strong Другие связи
              .import-difference-row(v-for="linkCandidate in ungroupedLinks" :key="linkCandidate.key")
                .import-difference-name
                  | {{ linkCandidate.sourceName }}
                  span.import-link-arrow ↔
                  | {{ linkCandidate.targetName }}
                .import-three-columns
                  button.import-merge-cell.import-choice-cell(
                    type="button"
                    :disabled="!linkCandidate.incoming"
                    :class="{ 'is-selected': linkDecisions[linkCandidate.key].side === 'local' }"
                    @click="toggleLinkResolution(linkCandidate.key, 'local')"
                  ) {{ getLinkValue(linkCandidate.local) }}
                  .import-merge-cell.import-result-cell(
                    :class="{ 'has-result': linkDecisions[linkCandidate.key].side !== 'none' }"
                  ) {{ getResolvedLinkValue(linkCandidate) }}
                  button.import-merge-cell.import-choice-cell(
                    type="button"
                    :disabled="!linkCandidate.incoming"
                    :class="{ 'is-selected': linkDecisions[linkCandidate.key].side === 'incoming' }"
                    @click="toggleLinkResolution(linkCandidate.key, 'incoming')"
                  ) {{ getLinkValue(linkCandidate.incoming) }}

            .notification.is-light(v-if="mergeCandidates.length === 0 && ungroupedLinks.length === 0")
              | Различия не найдены.

          .import-dependency-summary(v-if="previewPlan")
            p.has-text-weight-semibold Предварительный итог
            .tags
              span.tag.is-success.is-light Новые контакты: {{ previewPlan.summary.createdNodes }}
              span.tag.is-info.is-light Обновления: {{ previewPlan.summary.updatedNodes }}
              span.tag.is-link.is-light Новые связи: {{ previewPlan.summary.addedLinks }}
              span.tag.is-info.is-light(v-if="previewPlan.summary.updatedLinks")
                | Обновления связей: {{ previewPlan.summary.updatedLinks }}
              span.tag.is-light Теги: {{ previewPlan.summary.addedTags }}
              span.tag.is-light Круги: {{ previewPlan.summary.addedCircles }}
              span.tag.is-warning.is-light(v-if="previewPlan.summary.skippedLinks")
                | Пропущено связей: {{ previewPlan.summary.skippedLinks }}
            button.button.is-small.is-warning.is-light(
              v-if="previewPlan.summary.skippedLinks"
              type="button"
              @click="selectRelatedContacts"
            )
              span.icon.is-small
                i.fa.fa-link
              span Выбрать связанные контакты

        .notification.is-danger.is-light(v-if="errorMessage") {{ errorMessage }}
      footer.modal-card-foot.import-preview-actions
        button.button(type="button" @click="backToSelect") Назад
        button.button(
          type="button"
          :class="importMode === 'replace' ? 'is-danger' : 'is-info'"
          :disabled="importMode === 'merge' && !hasMergeSelection"
          @click="applyImport"
        )
          span.icon
            i.fa(:class="importMode === 'replace' ? 'fa-rotate' : 'fa-code-merge'")
          span {{ importMode === 'replace' ? 'Заменить данные' : 'Объединить данные' }}

    template(v-else-if="phase === 'result' && resultPlan")
      section.modal-card-body
        .notification.is-success.is-light
          strong Импорт завершён.
        .content
          ul
            li Создано контактов: {{ resultPlan.summary.createdNodes }}
            li Обновлено контактов: {{ resultPlan.summary.updatedNodes }}
            li Добавлено связей: {{ resultPlan.summary.addedLinks }}
            li(v-if="resultPlan.summary.updatedLinks") Обновлено связей: {{ resultPlan.summary.updatedLinks }}
            li Добавлено тегов: {{ resultPlan.summary.addedTags }}
            li Добавлено кругов: {{ resultPlan.summary.addedCircles }}
            li(v-if="resultPlan.summary.skippedLinks") Пропущено связей: {{ resultPlan.summary.skippedLinks }}
      footer.modal-card-foot.import-preview-actions
        button.button.is-success(type="button" @click="close") Готово
</template>

<style scoped>
.transfer-modal {
  width: min(1080px, calc(100vw - 2rem));
}

.transfer-modal-head {
  gap: 1rem;
}

.transfer-head-content {
  min-width: 0;
  flex: 1;
}

.transfer-head-content .modal-card-title {
  line-height: 1.2;
}

.transfer-current-network {
  display: flex;
  align-items: baseline;
  gap: 0.55rem;
  min-width: 0;
  margin-top: 0.3rem;
  color: var(--app-text-muted);
  font-size: 0.76rem;
}

.transfer-current-network strong {
  max-width: 320px;
  color: var(--app-text);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.transfer-head-actions {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  flex-shrink: 0;
}

.transfer-columns {
  margin-bottom: 0;
}

.transfer-column + .transfer-column {
  border-left: 1px solid var(--app-border);
}

.transfer-column .title {
  color: var(--app-text);
}

.import-warning {
  margin-top: 1rem;
  margin-bottom: 0 !important;
}

.import-premium-note {
  display: flex;
  align-items: flex-start;
  gap: 0.55rem;
  margin-top: 0.75rem;
  margin-bottom: 0 !important;
}

.import-premium-note > .icon {
  color: #b77900;
}

.import-premium-note strong, .import-premium-note p {
  display: block;
}

.import-premium-note p {
  margin: 0.18rem 0 0.5rem;
  font-size: 0.82rem;
  line-height: 1.35;
}

.transfer-modal-actions,
.import-preview-actions {
  width: 100%;
}

.transfer-modal-actions .import-action,
.import-preview-actions .button:last-child {
  margin-left: auto;
}

.import-preview {
  min-height: 320px;
}

.import-file-summary {
  padding-bottom: 0.75rem;
  border-bottom: 1px solid var(--app-border);
}

.import-guidance {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  margin: 0.75rem 0;
  padding: 0.55rem 0.7rem;
  border: 1px solid var(--app-border);
  border-radius: 6px;
  background: var(--app-surface-muted);
  font-size: 0.76rem;
}

.import-guidance-text {
  margin: 0;
  color: var(--app-text-muted);
}

.import-guidance-conflicts {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 0.8rem;
  margin-left: auto;
  text-align: right;
}

.import-guidance-conflicts span {
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
  white-space: nowrap;
}

.import-toolbar .control.is-expanded,
.import-toolbar .input {
  min-width: 0;
}

.import-selection-actions {
  align-items: center;
  margin-bottom: 0.5rem !important;
}

.import-main-merge {
  max-height: min(56vh, 560px);
  overflow: auto;
  border: 1px solid var(--app-border);
  border-radius: 7px;
  background: var(--app-surface);
}

.import-main-head {
  position: sticky;
  top: 0;
  z-index: 3;
  display: grid;
  grid-template-columns: repeat(3, minmax(190px, 1fr));
  gap: 0.45rem;
  min-width: 650px;
  margin-left: 170px;
  padding: 0.65rem 0.8rem 0.65rem 0;
  border-bottom: 1px solid var(--app-border);
  background: var(--app-surface);
  color: var(--app-text-muted);
  font-size: 0.72rem;
  font-weight: 700;
  text-align: center;
  text-transform: uppercase;
}

.import-main-head span:nth-child(2) {
  color: #3e8ed0;
}

.import-node-group {
  min-width: 820px;
  border-bottom: 1px solid var(--app-border);
}

.import-node-group:last-child {
  border-bottom: 0;
}

.import-node-title {
  position: sticky;
  left: 0;
  z-index: 1;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  padding: 0.7rem 0.8rem;
  background: var(--app-surface-muted);
}

.import-difference-row {
  padding: 0.55rem 0.8rem;
  border-top: 1px solid var(--app-border);
}

.import-difference-name {
  display: flex;
  align-items: center;
  width: 150px;
  min-height: 1.5rem;
  margin-bottom: 0.35rem;
  font-size: 0.78rem;
  font-weight: 600;
}

.import-three-columns {
  display: grid;
  grid-template-columns: repeat(3, minmax(190px, 1fr));
  gap: 0.45rem;
  min-width: 650px;
  margin-left: 158px;
}

.import-difference-name + .import-three-columns {
  margin-left: 158px;
  margin-top: -1.85rem;
}

.import-merge-cell {
  min-width: 0;
  min-height: 48px;
  padding: 0.55rem 0.65rem;
  border: 1px solid transparent;
  border-radius: 5px;
  background: var(--app-surface-muted);
  color: var(--app-text);
  font-size: 0.8rem;
  line-height: 1.35;
  text-align: left;
  overflow-wrap: anywhere;
}

.import-choice-cell {
  cursor: pointer;
  font: inherit;
  transition: border-color 120ms ease, background-color 120ms ease, box-shadow 120ms ease;
}

.import-choice-cell:hover:not(:disabled) {
  border-color: var(--app-text-muted);
}

.import-choice-cell.is-selected {
  border-color: #3e8ed0;
  background: color-mix(in srgb, #3e8ed0 10%, var(--app-surface-muted));
  box-shadow: inset 3px 0 0 #3e8ed0;
}

.import-choice-cell:disabled {
  cursor: default;
  opacity: 1;
}

.import-result-cell {
  display: flex;
  align-items: center;
  justify-content: center;
  border-color: color-mix(in srgb, var(--app-border) 75%, #3e8ed0);
  color: var(--app-text-muted);
  text-align: center;
}

.import-result-cell.has-result {
  background: color-mix(in srgb, #3e8ed0 8%, var(--app-surface));
  color: var(--app-text);
  font-weight: 600;
}

.import-node-links {
  background: color-mix(in srgb, var(--app-surface-muted) 45%, transparent);
}

.import-subsection-title {
  padding: 0.45rem 0.8rem;
  border-top: 1px solid var(--app-border);
  color: var(--app-text-muted);
  font-size: 0.72rem;
  font-weight: 700;
  text-transform: uppercase;
}

.import-candidate-list {
  max-height: min(48vh, 430px);
  overflow-y: auto;
  border: 1px solid var(--app-border);
  border-radius: 6px;
}

.import-dependency-summary {
  margin-top: 0.75rem;
  padding: 0.65rem 0.75rem;
  border: 1px solid var(--app-border);
  border-radius: 6px;
  background: var(--app-surface-muted);
}

.import-links {
  margin-top: 1rem;
}

.import-section-title {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 0.5rem;
}

.import-link-list {
  border: 1px solid var(--app-border);
  border-radius: 6px;
}

.import-link {
  padding: 0.7rem 0.8rem;
  border-bottom: 1px solid var(--app-border);
  overflow-x: auto;
}

.import-link:last-child {
  border-bottom: 0;
}

.import-link-arrow {
  padding: 0 0.4rem;
  color: var(--app-text-muted);
}

.import-dependency-summary .tags {
  margin: 0.4rem 0;
}

.import-candidate {
  padding: 0.7rem 0.8rem;
  border-bottom: 1px solid var(--app-border);
}

.import-candidate:last-child {
  border-bottom: 0;
}

.import-candidate-head,
.import-field-row {
  padding: 0.55rem 0;
  border-top: 1px solid var(--app-border);
}

.import-conflicts {
  margin-top: 0.5rem;
  overflow-x: auto;
}

.import-conflicts summary {
  color: var(--app-text-muted);
  font-size: 0.8rem;
  cursor: pointer;
}

.import-field-title {
  margin-bottom: 0.35rem;
  font-weight: 600;
}

.import-merge-head,
.import-field-values {
  display: grid;
  grid-template-columns: repeat(3, minmax(180px, 1fr));
  gap: 0.4rem;
  min-width: 590px;
}

.import-merge-head {
  margin-top: 0.5rem;
  color: var(--app-text-muted);
  font-size: 0.7rem;
  font-weight: 700;
  text-align: center;
  text-transform: uppercase;
}

.import-field-value {
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 0.15rem;
  padding: 0.35rem 0.45rem;
  border: 1px solid transparent;
  border-radius: 4px;
  background: var(--app-surface-muted);
  color: var(--app-text);
  font-size: 0.8rem;
  text-align: left;
}

.import-field-choice {
  cursor: pointer;
  font: inherit;
  transition: border-color 120ms ease, background-color 120ms ease, box-shadow 120ms ease;
}

.import-field-choice:hover {
  border-color: var(--app-text-muted);
}

.import-field-choice.is-selected {
  border-color: #3e8ed0;
  background: color-mix(in srgb, #3e8ed0 10%, var(--app-surface-muted));
  box-shadow: inset 3px 0 0 #3e8ed0;
}

.import-field-value span:last-child {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.import-field-label {
  color: var(--app-text-muted);
  font-size: 0.68rem;
  font-weight: 600;
  text-transform: uppercase;
}

.import-field-pick {
  margin-top: 0.25rem;
  color: #3e8ed0;
  font-size: 0.72rem;
  font-weight: 600;
}

@media screen and (max-width: 768px) {
  .transfer-modal-head,
  .transfer-current-network,
  .import-guidance,
  .import-guidance-conflicts {
    align-items: flex-start;
  }

  .transfer-current-network,
  .import-guidance {
    flex-direction: column;
    gap: 0.3rem;
  }

  .import-guidance-conflicts {
    flex-direction: column;
    margin-left: 0;
    text-align: left;
  }

  .transfer-column + .transfer-column {
    border-top: 1px solid var(--app-border);
    border-left: 0;
  }

  .import-file-summary,
  .import-candidate-head,
  .import-field-row {
    align-items: flex-start;
  }

}
</style>

<script setup lang="ts">
import {computed, nextTick, onBeforeUnmount, onMounted, ref, watch} from "vue";
import {useRouter} from "vue-router";
import SettingGraph from "@/networker/components/SettingGraph.vue";
import NetworkList from "@/networker/components/NetworkList.vue";
import FunctionalCircleCard from "@/networker/components/FunctionalCircleCard.vue";
import {DrawNetwork} from "@/networker/graph/draw";
import type {Tag} from "@/networker/entity/graph/tag";
import {Node} from "@/networker/entity/graph/node";
import {Link} from "@/networker/entity/graph/link";
import {Network} from "@/networker/entity/graph/network";
import {GraphService} from "@/networker/service/graphService";
import {NetworkService} from "@/networker/service/networkService";
import NodeCard from "@/networker/components/NodeCard.vue";
import LinkCard from "@/networker/components/LinkCard.vue";
import TagManager from "@/networker/components/TagManager.vue";
import {NodeToolTip} from "@/networker/graph/toolTip";
import {JsonFileAdapter} from "@/networker/service/transfer/fileAdapter";
import packageJson from "../../../package.json";

const router = useRouter()
let networkId = ref(0)
if(router.currentRoute.value.params.id) {
  networkId.value = Number(router.currentRoute.value.params.id)
}
let graphService = new GraphService({storeId: networkId.value});
let networkService = new NetworkService({storeId: networkId.value});

const links = ref(graphService.links);
const funcCircle = ref(graphService.funcCircles);
const networks = ref(networkService.networks);
const graphRevision = ref(0)

watch(
    () => router.currentRoute.value.params.id,
    () => {
      networkId.value = Number(router.currentRoute.value.params.id) ?? 0
      graphService = new GraphService({storeId: networkId.value});
      links.value = graphService.links
      funcCircle.value = graphService.funcCircles
      activeTagId.value = null
      draw.setActiveTagId(null)
      selectedNode.value = undefined
      clearNodeSearch()
      reRender()
    }
)


const currentNetwork = ref<Network | undefined>(networkService.findNetwork(networkId.value));

const isLoading = ref(false)
const isSaved = ref(false)

const graphId = 'nw-graph'
const draw: DrawNetwork = new DrawNetwork({
  dto: graphService.toDTO(),
  box: {w:800,h:600},
  toolTip: new NodeToolTip(),
  clickNode: (e: any, d: Node): void => {
    graphService.setCurrentNode(d)
    selectedNode.value = d
    reRender()
  },
  cbSimulationEnd: (): void => {saveAll()}
})

const debounceReRender = graphService.createDebounce()
const reRender = (): void => {
  isLoading.value = true
  graphRevision.value += 1
  draw.dto = graphService.toDTO();
  debounceReRender(() => {draw.reRender()}, 750)
}

const saveAll = (): void => {
  graphService.saveAll()
  isLoading.value = false
  isSaved.value = true

  links.value = graphService.links
  funcCircle.value = graphService.funcCircles

  setTimeout(() => {isSaved.value = false}, 5000)
}

const debounceChange = graphService.createDebounce()
const change = (): void => {
  debounceChange(() => {reRender()}, 700)
}

const addNode = (): void => {
  selectedNode.value = graphService.addNode();
  graphService.setCurrentNode(selectedNode.value)
  reRender()
}

const removeNode = (): void => {
  graphService.removeNode(graphService.getCurrentNode());
  selectedNode.value = undefined
  reRender();
}

const changeLink = (): void => {
  reRender();
}

const addNetwork = (): void => {
  const network = networkService.addNetwork()
  currentNetwork.value = network
  networkService.saveAll()
  router.push({params: {id: network.id}})
}

const saveNetwork = (): void => {
  networkService.saveAll()
}

const removeNetwork = (network: Network): void => {
  networkService.removeNetwork(network);
  currentNetwork.value = undefined
  networkService.saveAll()
  router.push({params: {id: 0}})
}

const switchNetwork = (item: Network): void => {
  currentNetwork.value = item
  router.push({params: {id: item.id}})
}

const changeFact = (): void => {
  reRender();
}

const changeTag = (): void => {
  if (activeTagId.value !== null && !graphService.tags.some((tag: Tag): boolean => tag.id === activeTagId.value)) {
    activeTagId.value = null
    draw.setActiveTagId(null)
  }
  saveAll();
  reRender();
}

const importNetwork = (): void => {
  reRender();
}

const pageElement = ref<HTMLElement | null>(null)
const graphHost = ref<HTMLElement | null>(null)
const importFileInput = ref<HTMLInputElement | null>(null)
const pageHeight = ref(720)
const activeInfoPanel = ref<string | null>(null)
const activeTagId = ref<number | null>(null)
const selectedNode = ref<Node | undefined>(undefined)
const isTransferModalOpen = ref(false)
const nodeSearchQuery = ref('')
const selectedSearchNodeId = ref<number | null>(null)
const isNodeSearchOpen = ref(false)
let isGraphRendered = false

const matchingSearchNodes = computed((): Node[] => {
  graphRevision.value
  const query = nodeSearchQuery.value.trim().toLocaleLowerCase('ru-RU')

  if (!query) {
    return [...graphService.nodes]
  }

  return graphService.nodes.filter((node: Node): boolean => {
    const searchableText = `${node.getName()} ${node.description ?? ''}`.toLocaleLowerCase('ru-RU')
    return searchableText.includes(query)
  })
})

const visibleSearchNodes = computed((): Node[] => matchingSearchNodes.value.slice(0, 8))

const updateSearchHighlight = (): void => {
  if (selectedSearchNodeId.value !== null) {
    const selectedNodeExists = graphService.nodes.some(
      (node: Node): boolean => node.id === selectedSearchNodeId.value,
    )

    if (selectedNodeExists) {
      draw.setSearchHighlightedNodeIds([selectedSearchNodeId.value])
      return
    }

    selectedSearchNodeId.value = null
  }

  if (!nodeSearchQuery.value.trim()) {
    draw.setSearchHighlightedNodeIds([])
    return
  }

  draw.setSearchHighlightedNodeIds(
    matchingSearchNodes.value
      .map((node: Node): number | undefined => node.id)
      .filter((id: number | undefined): id is number => id !== undefined),
  )
}

watch(
  [nodeSearchQuery, selectedSearchNodeId, graphRevision],
  updateSearchHighlight,
)

const updatePageHeight = (): void => {
  const top = pageElement.value?.getBoundingClientRect().top ?? 0
  pageHeight.value = Math.max(560, window.innerHeight - top)
}

const applyGraphSize = (): void => {
  if (!graphHost.value) {
    return
  }

  const width = Math.max(800, graphHost.value.clientWidth)
  const height = Math.max(560, graphHost.value.clientHeight)

  draw.box.w = width
  draw.box.h = height
  draw.divElement?.style('width', `${width}px`).style('height', `${height}px`)
  draw.graph?.attr('width', `${width}px`).attr('height', `${height}px`)
}

const resizeWorkspace = (): void => {
  updatePageHeight()
  nextTick(() => {
    applyGraphSize()
  })
}

const renderGraph = (): void => {
  const host = graphHost.value ?? document.getElementById(graphId)
  if (!host || isGraphRendered) {
    return
  }

  graphHost.value = host
  applyGraphSize()
  draw.render(host)
  isGraphRendered = true
  applyGraphSize()
}

const toggleInfoPanel = (panelName: string): void => {
  activeInfoPanel.value = activeInfoPanel.value === panelName ? null : panelName
}

const selectTag = (tag: Tag): void => {
  activeTagId.value = activeTagId.value === tag.id ? null : tag.id
  draw.setActiveTagId(activeTagId.value)
  reRender()
}

const hideNodeControl = (): void => {
  graphService.setCurrentNode(undefined)
  selectedNode.value = undefined
  reRender()
}

const handleNodeSearchInput = (): void => {
  selectedSearchNodeId.value = null
  isNodeSearchOpen.value = true
}

const selectSearchNode = (node: Node): void => {
  nodeSearchQuery.value = node.getName()
  selectedSearchNodeId.value = node.id ?? null
  isNodeSearchOpen.value = false
}

const selectFirstSearchNode = (): void => {
  const firstNode = visibleSearchNodes.value[0]
  if (firstNode) {
    selectSearchNode(firstNode)
  }
}

const clearNodeSearch = (): void => {
  nodeSearchQuery.value = ''
  selectedSearchNodeId.value = null
  isNodeSearchOpen.value = false
  draw.setSearchHighlightedNodeIds([])
}

const addNodeFromSearch = (): void => {
  clearNodeSearch()
  addNode()
}

const closeNodeSearch = (): void => {
  window.setTimeout((): void => {
    isNodeSearchOpen.value = false
  }, 100)
}

const openTransferModal = (): void => {
  isTransferModalOpen.value = true
}

const closeTransferModal = (): void => {
  isTransferModalOpen.value = false
}

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

  graphService.setFileAdapter(new JsonFileAdapter({
    version: packageJson.version,
    exportedAt: exportedAt.toISOString(),
    exportedAtReadable: exportedAt.toLocaleString('ru-RU'),
    networkName: currentNetwork.value?.name ?? 'Основная',
  }))
  const dataUri = "data:text/json;charset=utf-8," + encodeURIComponent(graphService.export());
  const anchorElement = document.createElement('a');
  anchorElement.href = dataUri;
  anchorElement.download = `pcm-helper-${formatExportFileDateTime(exportedAt)}.json`;
  document.body.appendChild(anchorElement);
  anchorElement.click();
  document.body.removeChild(anchorElement);
  closeTransferModal()
}

const selectImportFile = (): void => {
  importFileInput.value?.click()
}

const importNetworkFile = (event: Event): void => {
  const input = event.target as HTMLInputElement
  const file = input.files?.[0];
  if (!file) return;

  const reader = new FileReader();

  reader.onload = e => {
    try {
      const data = e.target?.result;
      if (typeof data !== 'string') {
        throw new Error('Файл должен быть текстовым JSON-файлом.');
      }

      graphService.setFileAdapter(new JsonFileAdapter())
      graphService.import(data)
      selectedNode.value = undefined
      importNetwork()
      closeTransferModal()
    } catch (error) {
      console.error('Ошибка импорта:', error);
    } finally {
      input.value = ''
    }
  };

  reader.onerror = e => {
    console.error('Ошибка FileReader:', e);
  };

  reader.readAsText(file);
}

onMounted(async (): Promise<void> => {
  updatePageHeight()
  await nextTick()
  requestAnimationFrame(() => {
    renderGraph()
  })
  window.addEventListener('resize', resizeWorkspace)
})

onBeforeUnmount((): void => {
  window.removeEventListener('resize', resizeWorkspace)
})

</script>

<template lang="pug">
.mymra-page(ref="pageElement" :style="{height: `${pageHeight}px`}")
  .network-scene
    .network-graph(ref="graphHost" :id="graphId")

    .workspace-topbar
      .network-menu
        network-list(
          :current-network="currentNetwork"
          :networks="networks"
          :graph-service="graphService"
          @saveNetwork="saveNetwork"
          @addNetwork="addNetwork"
          @removeNetwork="removeNetwork"
          @switchNetwork="switchNetwork"
        )
        .network-menu-actions
          button.button.is-small.is-light(type="button" title="Импорт и экспорт сети" @click="openTransferModal")
            span.icon
              i.fa.fa-file-arrow-down
          button.button.is-small.is-info(type="button" title="Добавить контакт" @click="addNode")
            span.icon
              i.fa.fa-user-plus
            span Добавить контакт
      .saved.tag.is-success.is-light(v-if="isSaved") Сохранено {{ new Date() }}

    form.node-search(@submit.prevent="selectFirstSearchNode")
      .field.has-addons
        .control.is-expanded.has-icons-left
          input.input.is-small(
            v-model="nodeSearchQuery"
            type="search"
            placeholder="Поиск по узлам"
            autocomplete="off"
            aria-label="Поиск по узлам"
            aria-autocomplete="list"
            :aria-expanded="isNodeSearchOpen"
            @focus="isNodeSearchOpen = true"
            @input="handleNodeSearchInput"
            @blur="closeNodeSearch"
            @keydown.esc="isNodeSearchOpen = false"
          )
          span.icon.is-small.is-left
            i.fa.fa-magnifying-glass
        .control(v-if="nodeSearchQuery")
          button.button.is-small(
            type="button"
            title="Очистить поиск"
            aria-label="Очистить поиск"
            @mousedown.prevent
            @click="clearNodeSearch"
          )
            span.icon.is-small
              i.fa.fa-xmark
      .node-search-dropdown(v-if="isNodeSearchOpen")
        button.node-search-option(
          v-for="node in visibleSearchNodes"
          :key="node.id"
          type="button"
          @mousedown.prevent="selectSearchNode(node)"
        )
          span.node-search-option-name {{ node.getName() || `Узел ${node.id}` }}
          span.node-search-option-description(v-if="node.description") {{ node.description }}
        .node-search-empty(v-if="visibleSearchNodes.length === 0")
          span Ничего не найдено
          button.button.is-small.is-info(
            type="button"
            @mousedown.prevent
            @click="addNodeFromSearch"
          )
            span.icon.is-small
              i.fa.fa-user-plus
            span Добавить
        .node-search-more(v-else-if="matchingSearchNodes.length > visibleSearchNodes.length")
          | Ещё {{ matchingSearchNodes.length - visibleSearchNodes.length }}

    setting-graph.node-control-panel(
      v-if="selectedNode"
      :graph-service="graphService"
      :links="links"
      @change="change"
      @removeNode="removeNode"
      @changeLink="changeLink"
      @changeFact="changeFact"
      @changeTag="changeTag"
      @close="hideNodeControl"
    )

    .info-dock
      .info-actions
        button.button.is-small.is-light(
          :class="{'is-info': activeInfoPanel === 'data'}"
          type="button"
          title="Информация"
          @click="toggleInfoPanel('data')"
        )
          span.icon
            i.fa.fa-circle-info
        button.button.is-small.is-light(
          :class="{'is-info': activeInfoPanel === 'circle'}"
          type="button"
          title="Круги"
          @click="toggleInfoPanel('circle')"
        )
          span.icon
            i.fa.fa-circle-nodes
        button.button.is-small.is-light(
          :class="{'is-info': activeInfoPanel === 'node'}"
          type="button"
          title="Узлы"
          @click="toggleInfoPanel('node')"
        )
          span.icon
            i.fa.fa-user
        button.button.is-small.is-light(
          :class="{'is-info': activeInfoPanel === 'link'}"
          type="button"
          title="Связи"
          @click="toggleInfoPanel('link')"
        )
          span.icon
            i.fa.fa-link
        button.button.is-small.is-light(
          :class="{'is-info': activeInfoPanel === 'tag'}"
          type="button"
          title="Теги"
          @click="toggleInfoPanel('tag')"
        )
          span.icon
            i.fa.fa-tags

      .card.info-panel(v-if="activeInfoPanel === 'data'")
        header.card-header
          p.card-header-title Информация
          button.card-header-icon(type="button" title="Закрыть" aria-label="Закрыть" @click="activeInfoPanel = null")
            span.delete
        .card-content
          .notification.is-warning.is-light.data-note
            | Данные хранятся в браузере и сохраняются автоматически.
          .content.info-guide
            p.has-text-weight-semibold Как использовать мымру
            ul
              li Создавайте контакты кнопкой "Добавить контакт" и отмечайте PCM-цвет, тип контакта, теги и описание.
              li Связывайте контакты на вкладке связей, чтобы видеть маршруты и ближайшее окружение.
              li Используйте функциональные круги для группировки контактов по близости: поддержка, продуктивность, развитие.
              li Открывайте теги снизу, выбирайте активный тег и быстро подсвечивайте связанные с ним ноды на графе.
              li На вкладке волшебной палочки можно отправить текст и получить предположение о PCM-типе контакта.
      FunctionalCircleCard.info-panel(
        v-if="activeInfoPanel === 'circle'"
        @close="activeInfoPanel = null"
      )
      NodeCard.info-panel(
        v-if="activeInfoPanel === 'node'"
        @close="activeInfoPanel = null"
      )
      LinkCard.info-panel(
        v-if="activeInfoPanel === 'link'"
        @close="activeInfoPanel = null"
      )
      TagManager.info-panel(
        v-if="activeInfoPanel === 'tag'"
        :graph-service="graphService"
        :active-tag-id="activeTagId"
        @change="changeTag"
        @select="selectTag"
        @close="activeInfoPanel = null"
      )

  .modal(:class="{'is-active': isTransferModalOpen}")
    .modal-background(@click="closeTransferModal")
    .modal-card.transfer-modal
      header.modal-card-head
        p.modal-card-title Импорт и экспорт сети
        button.delete(type="button" aria-label="close" @click="closeTransferModal")
      section.modal-card-body
        .columns.transfer-columns
          .column.transfer-column
            h3.title.is-5 Экспорт
            p Сохранит текущую сеть в JSON-файл с датой и временем создания.
          .column.transfer-column
            h3.title.is-5 Импорт
            p Заменит данные текущей сети содержимым выбранного JSON-файла.
            .notification.is-warning.is-light.import-warning
              strong Важно:
              |  старые данные будут безвозвратно утеряны.
            input.is-hidden(ref="importFileInput" type="file" accept="application/json,.json" @change="importNetworkFile")
      footer.modal-card-foot.transfer-modal-actions
        button.button.is-info(type="button" @click="exportNetworkFile")
          span.icon
            i.fa.fa-file-export
          span Экспорт
        button.button.is-warning.import-action(type="button" @click="selectImportFile")
          span.icon
            i.fa.fa-file-import
          span Импорт
</template>

<style>
.mymra-page {
  position: relative;
  width: 100%;
  overflow: hidden;
  background: var(--app-background);
}

.network-scene,
.network-graph {
  position: absolute;
  inset: 0;
}

.network-graph {
  overflow: hidden;
}

.graph-container {
  width: 100% !important;
  height: 100% !important;
}

.graph-container svg {
  display: block;
  width: 100%;
  height: 100%;
}

.graph-container .tooltip {
  display: none;
  position: absolute;
  z-index: 10;
}

.graph-container .nodes circle.is-search-highlighted {
  animation: node-search-pulse 1.6s ease-in-out infinite;
  vector-effect: non-scaling-stroke;
}

@keyframes node-search-pulse {
  0%,
  100% {
    stroke: var(--app-search-highlight);
    stroke-width: 5px;
    filter: drop-shadow(0 0 1px var(--app-search-highlight));
  }

  50% {
    stroke: var(--app-search-highlight);
    stroke-width: 11px;
    filter: drop-shadow(0 0 7px var(--app-search-highlight));
  }
}

.workspace-topbar,
.node-search,
.node-control-panel,
.info-dock {
  position: absolute;
  z-index: 5;
}

.workspace-topbar {
  top: 0.25rem;
  left: 0.5rem;
  right: 0.5rem;
  display: flex;
  align-items: flex-start;
  gap: 0.75rem;
  pointer-events: none;
}

.network-menu {
  max-width: min(720px, 100%);
  padding: 0.5rem 0.75rem;
  border: 1px solid var(--app-border);
  border-radius: 6px;
  background: var(--app-surface-soft);
  box-shadow: var(--app-shadow);
  pointer-events: auto;
}

.network-menu {
  display: flex;
  align-items: flex-start;
  gap: 0.5rem;
}

.network-menu > .network-list {
  flex: 1;
  min-width: 0;
}

.network-menu-actions {
  display: flex;
  align-items: center;
  gap: 0.35rem;
  padding-top: 0.1rem;
}

.network-menu .tabs {
  margin-bottom: 0.25rem;
}

.network-menu .tabs a {
  padding: 0.35rem 0.65rem;
}

.network-menu .field,
.network-menu .mb-2 {
  margin-bottom: 0 !important;
}

.saved {
  pointer-events: none;
}

.node-search {
  top: 0.5rem;
  left: 50%;
  z-index: 6;
  width: min(380px, calc(100vw - 1rem));
  transform: translateX(-50%);
}

.node-search .field {
  margin-bottom: 0;
  filter: drop-shadow(0 0.25rem 0.6rem rgb(0 0 0 / 12%));
}

.node-search-dropdown {
  position: absolute;
  top: calc(100% + 0.25rem);
  left: 0;
  width: 100%;
  max-height: min(50vh, 320px);
  overflow-y: auto;
  border: 1px solid var(--app-border);
  border-radius: 6px;
  background: var(--app-surface);
  box-shadow: var(--app-shadow);
}

.node-search-option {
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: 0.1rem;
  padding: 0.55rem 0.75rem;
  border: 0;
  border-bottom: 1px solid var(--app-border);
  background: transparent;
  color: var(--app-text);
  text-align: left;
  cursor: pointer;
}

.node-search-option:hover,
.node-search-option:focus {
  background: var(--app-surface-muted);
  outline: none;
}

.node-search-option-name {
  font-weight: 600;
}

.node-search-option-description {
  overflow: hidden;
  color: var(--app-text-muted);
  font-size: 0.75rem;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.node-search-empty,
.node-search-more {
  padding: 0.6rem 0.75rem;
  color: var(--app-text-muted);
  font-size: 0.8rem;
}

.node-search-empty {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.75rem;
}

.node-control-panel {
  top: 0;
  right: 0;
  bottom: 0;
  width: min(430px, calc(100vw - 1.5rem));
  height: 100%;
  max-height: 100dvh;
  overflow-y: auto;
  margin-bottom: 0;
  border: 1px solid var(--app-border);
  border-radius: 6px 0 0 6px;
  background: var(--app-surface-soft);
  box-shadow: var(--app-shadow);
}

.node-control-panel .message {
  margin-bottom: 0;
}

.transfer-modal {
  width: min(720px, calc(100vw - 2rem));
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

.transfer-modal-actions {
  width: 100%;
}

.transfer-modal-actions .import-action {
  margin-left: auto;
}

.info-dock {
  left: 0.35rem;
  bottom: 0.35rem;
  width: min(520px, calc(100vw - 0.7rem));
  display: flex;
  flex-direction: column-reverse;
  align-items: flex-start;
  gap: 0.5rem;
  pointer-events: none;
}

.data-note,
.info-actions,
.info-panel {
  pointer-events: auto;
}

.info-actions {
  width: fit-content;
  display: flex;
  justify-content: flex-start;
  gap: 0.35rem;
  padding: 0.25rem;
  border: 1px solid var(--app-border);
  border-radius: 6px;
  background: var(--app-surface-soft);
  box-shadow: var(--app-shadow);
}

.info-panel {
  width: min(520px, 100%);
  max-height: min(62vh, 560px);
  display: flex;
  flex-direction: column;
  overflow: hidden;
  border: 1px solid var(--app-border);
  border-radius: 6px;
  background: var(--app-surface);
  box-shadow: var(--app-shadow);
}

.info-panel > .card-content {
  flex: 1 1 auto;
  min-height: 0;
  overflow: auto;
}

.data-note {
  margin-bottom: 0 !important;
  padding: 0.75rem;
  border-radius: 6px;
  font-size: 0.85rem;
  line-height: 1.35;
}

.info-panel .message,
.info-panel .notification {
  margin-bottom: 0;
}

@media screen and (max-width: 768px) {
  .workspace-topbar {
    flex-direction: column;
  }

  .node-control-panel {
    top: 0;
    left: auto;
    width: auto;
    max-height: 100dvh;
  }

  .node-search {
    top: 4.5rem;
    width: min(380px, calc(100vw - 1rem));
  }

  .info-dock {
    right: 0.35rem;
    width: auto;
  }

  .info-actions {
    justify-content: flex-start;
    overflow-x: auto;
  }

  .info-panel {
    width: auto;
  }

  .transfer-column + .transfer-column {
    border-top: 1px solid var(--app-border);
    border-left: 0;
  }
}
</style>

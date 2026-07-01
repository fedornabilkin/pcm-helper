<script setup lang="ts">
import {nextTick, onBeforeUnmount, onMounted, ref, watch} from "vue";
import {useRouter} from "vue-router";
import SettingGraph from "@/networker/components/SettingGraph.vue";
import NetworkList from "@/networker/components/NetworkList.vue";
import FunctionalCircleCard from "@/networker/components/FunctionalCircleCard.vue";
import {DrawNetwork} from "@/networker/graph/draw";
import {Node} from "@/networker/entity/graph/node";
import {Link} from "@/networker/entity/graph/link";
import {Network} from "@/networker/entity/graph/network";
import {GraphService} from "@/networker/service/graphService";
import {NetworkService} from "@/networker/service/networkService";
import NodeCard from "@/networker/components/NodeCard.vue";
import LinkCard from "@/networker/components/LinkCard.vue";
import {NodeToolTip} from "@/networker/graph/toolTip";
import {JsonFileAdapter} from "@/networker/service/transfer/fileAdapter";

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

watch(
    () => router.currentRoute.value.params.id,
    () => {
      networkId.value = Number(router.currentRoute.value.params.id) ?? 0
      graphService = new GraphService({storeId: networkId.value});
      links.value = graphService.links
      funcCircle.value = graphService.funcCircles
      selectedNode.value = undefined
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
  saveAll();
}

const importNetwork = (): void => {
  reRender();
}

const pageElement = ref<HTMLElement | null>(null)
const graphHost = ref<HTMLElement | null>(null)
const importFileInput = ref<HTMLInputElement | null>(null)
const pageHeight = ref(720)
const activeInfoPanel = ref<string | null>(null)
const selectedNode = ref<Node | undefined>(undefined)
const isTransferModalOpen = ref(false)
let isGraphRendered = false

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

const hideNodeControl = (): void => {
  graphService.setCurrentNode(undefined)
  selectedNode.value = undefined
  reRender()
}

const openTransferModal = (): void => {
  isTransferModalOpen.value = true
}

const closeTransferModal = (): void => {
  isTransferModalOpen.value = false
}

const exportNetworkFile = (): void => {
  graphService.setFileAdapter(new JsonFileAdapter())
  const dataUri = "data:text/json;charset=utf-8," + encodeURIComponent(graphService.export());
  const anchorElement = document.createElement('a');
  anchorElement.href = dataUri;
  anchorElement.download = `pcm-helper-${(new Date()).getTime()}.json`;
  document.body.appendChild(anchorElement);
  anchorElement.click();
  document.body.removeChild(anchorElement);
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
          @saveNetwork="saveNetwork"
          @addNetwork="addNetwork"
          @removeNetwork="removeNetwork"
          @switchNetwork="switchNetwork"
        )
        .network-menu-actions
          button.button.is-small.is-light(type="button" title="Импорт и экспорт сети" @click="openTransferModal")
            span.icon
              i.fa.fa-file-arrow-down
      .saved.tag.is-success.is-light(v-if="isSaved") Сохранено {{ new Date() }}

    aside.node-control-panel(v-if="selectedNode")
      .node-control-header
        button.button.is-small.is-light(type="button" @click="hideNodeControl")
          span.icon
            i.fa.fa-eye-slash
          span Скрыть
      setting-graph.setting-graph(
        :graph-service="graphService"
        :links="links"
        @change="change"
        @addNode="addNode"
        @removeNode="removeNode"
        @changeLink="changeLink"
        @changeFact="changeFact"
        @changeTag="changeTag"
        @close="hideNodeControl"
      )

    .info-dock
      .notification.is-light.data-note
        | Данные хранятся в браузере и сохраняются автоматически.
      .info-actions
        button.button.is-small(:class="{'is-info': activeInfoPanel === 'circle'}" @click="toggleInfoPanel('circle')")
          span.icon
            i.fa.fa-circle-nodes
          span Круги
        button.button.is-small(:class="{'is-info': activeInfoPanel === 'node'}" @click="toggleInfoPanel('node')")
          span.icon
            i.fa.fa-user
          span Узлы
        button.button.is-small(:class="{'is-info': activeInfoPanel === 'link'}" @click="toggleInfoPanel('link')")
          span.icon
            i.fa.fa-link
          span Связи

      .info-panel(v-if="activeInfoPanel")
        button.delete.info-close(type="button" aria-label="close" @click="activeInfoPanel = null")
        FunctionalCircleCard(v-if="activeInfoPanel === 'circle'")
        NodeCard(v-if="activeInfoPanel === 'node'")
        LinkCard(v-if="activeInfoPanel === 'link'")

  .modal(:class="{'is-active': isTransferModalOpen}")
    .modal-background(@click="closeTransferModal")
    .modal-card.transfer-modal
      header.modal-card-head
        p.modal-card-title Импорт и экспорт сети
        button.delete(type="button" aria-label="close" @click="closeTransferModal")
      section.modal-card-body
        p Данные сети хранятся в браузере. Экспорт сохранит текущую сеть в JSON-файл, импорт заменит текущие данные содержимым выбранного файла.
        input.is-hidden(ref="importFileInput" type="file" accept="application/json,.json" @change="importNetworkFile")
      footer.modal-card-foot
        button.button.is-info(type="button" @click="exportNetworkFile")
          span.icon
            i.fa.fa-file-export
          span Экспорт
        button.button.is-warning(type="button" @click="selectImportFile")
          span.icon
            i.fa.fa-file-import
          span Импорт
</template>

<style>
.mymra-page {
  position: relative;
  width: 100%;
  overflow: hidden;
  background: #f5f5f5;
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

.workspace-topbar,
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
  border: 1px solid hsl(0deg 0% 86%);
  border-radius: 6px;
  background: hsl(0deg 0% 100% / 94%);
  box-shadow: 0 0.5rem 1.5rem hsl(0deg 0% 4% / 12%);
  pointer-events: auto;
}

.network-menu {
  display: flex;
  align-items: flex-start;
  gap: 0.5rem;
}

.network-menu > .tabs {
  flex: 1;
}

.network-menu-actions {
  display: flex;
  align-items: center;
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

.node-control-panel {
  top: 0;
  right: 0;
  bottom: 0;
  width: min(430px, calc(100vw - 1.5rem));
  height: 100%;
  max-height: none;
  overflow: auto;
  padding: 0.75rem;
  border: 1px solid hsl(0deg 0% 86%);
  border-radius: 6px 0 0 6px;
  background: hsl(0deg 0% 100% / 94%);
  box-shadow: 0 0.5rem 1.5rem hsl(0deg 0% 4% / 12%);
}

.node-control-header {
  display: flex;
  justify-content: flex-end;
  margin-bottom: 0.5rem;
}

.node-control-panel .message {
  margin-bottom: 0;
}

.transfer-modal {
  max-width: min(520px, calc(100vw - 2rem));
}

.info-dock {
  left: 0.35rem;
  right: 0.75rem;
  bottom: 0.35rem;
  display: grid;
  grid-template-columns: minmax(14rem, 1fr) auto;
  align-items: end;
  gap: 0.75rem;
  pointer-events: none;
}

.data-note,
.info-actions,
.info-panel {
  pointer-events: auto;
}

.data-note {
  width: fit-content;
  max-width: min(320px, 100%);
  margin-bottom: 0 !important;
  padding: 0.3rem 0.45rem;
  border-radius: 6px;
  font-size: 0.78rem;
  line-height: 1.2;
}

.info-actions {
  display: flex;
  justify-content: flex-end;
  gap: 0.5rem;
}

.info-panel {
  position: absolute;
  right: 0;
  bottom: 2.75rem;
  width: min(520px, 100%);
  max-height: min(62vh, 560px);
  overflow: auto;
  border-radius: 6px;
  box-shadow: 0 0.75rem 2rem hsl(0deg 0% 4% / 18%);
}

.info-close {
  position: absolute;
  top: 0.75rem;
  right: 0.75rem;
  z-index: 2;
}

@media screen and (max-width: 768px) {
  .workspace-topbar {
    flex-direction: column;
  }

  .node-control-panel {
    top: 0;
    left: auto;
    width: auto;
    max-height: none;
  }

  .info-dock {
    grid-template-columns: 1fr;
  }

  .info-actions {
    justify-content: flex-start;
    overflow-x: auto;
  }

  .info-panel {
    left: 0;
    right: 0;
    width: auto;
  }
}
</style>

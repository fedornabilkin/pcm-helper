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
import NetworkTransferModal from "@/networker/components/NetworkTransferModal.vue";
import type {ImportPlan} from "@/networker/service/import/graphImportService";
import PaymentMethodsButton from "@/components/monetisation/PaymentMethodsButton.vue";
import {PCM_HINT_FILTERS} from "@/networker/entity/graph/pcmHint";
import {usePremiumAccess} from '@/core/composable/access/premiumAccess'
import PremiumAccessButton from '@/components/monetisation/PremiumAccessButton.vue'

const router = useRouter()
const {isPremium} = usePremiumAccess()
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
      isLinkEditMode.value = false
      draw.setLinkEditMode(false)
      clearLinkSource()
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
    handleGraphNodeClick(e, d)
  },
  clickLink: (e: any, d: Link): void => {
    handleGraphLinkClick(e, d)
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
  const node = graphService.addNode()
  if (!node) {
    return
  }
  selectedNode.value = node;
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
  if (!network) {
    return
  }

  currentNetwork.value = network
  networks.value = [...networkService.networks]
  networkService.saveAll()
  router.push({params: {id: network.id}})
}

const saveNetwork = (name?: string): void => {
  if (name && currentNetwork.value) {
    currentNetwork.value.name = name
  }
  networkService.saveAll()
}

const removeNetwork = async (network: Network): Promise<void> => {
  currentNetwork.value = undefined
  await router.push({params: {id: 0}})

  networkService.removeNetwork(network);
  networks.value = [...networkService.networks]
  networkService.saveAll()
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
  links.value = graphService.links
  funcCircle.value = graphService.funcCircles
  reRender();
}

const pageElement = ref<HTMLElement | null>(null)
const graphHost = ref<HTMLElement | null>(null)
const pageHeight = ref(720)
const activeInfoPanel = ref<string | null>(null)
const activeTagId = ref<number | null>(null)
const pcmScopeTagId = ref<number | null>(null)
const selectedNode = ref<Node | undefined>(undefined)
const isLinkEditMode = ref(false)
const linkSourceNode = ref<Node | undefined>(undefined)
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

const pcmHintStats = computed(() => {
  graphRevision.value
  const scopedNodes = pcmScopeTagId.value === null
    ? graphService.nodes
    : graphService.nodes.filter(node => node.tags.includes(pcmScopeTagId.value!))
  const nodesWithHints = scopedNodes.filter(node => Boolean(node.pcmHint?.filter))
  const countByFilter = new Map<string, number>()
  const countByNeed = new Map<string, number>()
  const environment = {
    innerInvolved: 0,
    innerDistant: 0,
    outerInvolved: 0,
    outerDistant: 0,
    incomplete: 0,
  }

  nodesWithHints.forEach(node => {
    const hint = node.pcmHint
    if (hint.filter) {
      countByFilter.set(hint.filter, (countByFilter.get(hint.filter) ?? 0) + 1)
    }
    ;(Array.isArray(hint.needs) ? hint.needs : []).forEach(need => countByNeed.set(need, (countByNeed.get(need) ?? 0) + 1))

    if (!hint.involvement || !hint.stimulus) {
      environment.incomplete += 1
      return
    }

    const key = hint.stimulus === 'inner'
      ? hint.involvement === 'involved' ? 'innerInvolved' : 'innerDistant'
      : hint.involvement === 'involved' ? 'outerInvolved' : 'outerDistant'
    environment[key] += 1
  })

  return {
    scopeTotal: scopedNodes.length,
    total: nodesWithHints.length,
    byFilter: PCM_HINT_FILTERS.map(item => ({...item, count: countByFilter.get(item.value) ?? 0})).filter(item => item.count > 0),
    byNeed: [...countByNeed.entries()]
      .map(([label, count]) => ({label, count}))
      .sort((first, second) => second.count - first.count || first.label.localeCompare(second.label, 'ru-RU')),
    environment,
  }
})

const pcmScopeTags = computed((): Tag[] => {
  graphRevision.value
  return graphService.tags.filter((tag: Tag) => tag.id > 0)
})

const pcmMeetingSuggestions = computed((): string[] => {
  const stats = pcmHintStats.value
  if (stats.total < 2) {
    return ['Для подсказки по формату встречи нужны хотя бы две заполненные PCM-гипотезы.']
  }

  const suggestions: string[] = []
  const filters = new Set(stats.byFilter.map(item => item.value))
  if (filters.has('logic') || filters.has('persistent')) {
    suggestions.push('Перед встречей пришлите короткую повестку, критерии и место для мнений.')
  }
  if (filters.has('soulful') || filters.has('rebel')) {
    suggestions.push('Оставьте в начале короткий живой чек-ин, а не переходите сразу к задаче.')
  }
  if (filters.has('dreamer')) {
    suggestions.push('В конце зафиксируйте один ясный следующий шаг и не перегружайте выбором.')
  }
  if (filters.has('activist')) {
    suggestions.push('Добавьте вариант быстро проверить решение действием и увидеть результат.')
  }
  if (!stats.byNeed.length) {
    suggestions.push('Потребности ещё не отмечены: обсудите заранее, что поможет участникам включиться в разговор.')
  } else if (!stats.byNeed.some(item => item.label === 'признание личности')) {
    suggestions.push('Можно заранее заложить короткое признание вклада и внимания друг к другу.')
  }
  if (stats.environment.incomplete) {
    suggestions.push(`Для ${stats.environment.incomplete} гипотез ещё не задана среда — не делайте выводов о предпочтительном формате.`)
  }
  return suggestions.slice(0, 3)
})

const setPcmScopeTag = (tagId: number | null): void => {
  pcmScopeTagId.value = pcmScopeTagId.value === tagId ? null : tagId
}

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
}

const hideNodeControl = (): void => {
  graphService.setCurrentNode(undefined)
  selectedNode.value = undefined
  reRender()
}

const clearLinkSource = (): void => {
  linkSourceNode.value = undefined
  draw.setLinkActionSourceNodeId(null)
}

const toggleLinkEditMode = (): void => {
  isLinkEditMode.value = !isLinkEditMode.value
  draw.setLinkEditMode(isLinkEditMode.value)
  clearLinkSource()

  if (isLinkEditMode.value) {
    graphService.setCurrentNode(undefined)
    selectedNode.value = undefined
    reRender()
  }
}

const handleGraphNodeClick = (event: Event, node: Node): void => {
  event.stopPropagation()
  if (!isLinkEditMode.value) {
    graphService.setCurrentNode(node)
    selectedNode.value = node
    reRender()
    return
  }

  if (!linkSourceNode.value) {
    linkSourceNode.value = node
    draw.setLinkActionSourceNodeId(node.id ?? null)
    return
  }

  if (linkSourceNode.value.id === node.id) {
    clearLinkSource()
    return
  }

  const existingLink = graphService.findLinkBetween(linkSourceNode.value, node)
  if (existingLink) {
    graphService.removeLink(existingLink)
  } else {
    graphService.addLinkBetween(linkSourceNode.value, node)
  }
  clearLinkSource()
  reRender()
}

const handleGraphLinkClick = (event: Event, link: Link): void => {
  event.stopPropagation()
  if (!isLinkEditMode.value) {
    return
  }

  graphService.removeLink(link)
  clearLinkSource()
  reRender()
}

const handleWorkspaceKeydown = (event: KeyboardEvent): void => {
  if (event.key === 'Escape' && isLinkEditMode.value) {
    isLinkEditMode.value = false
    draw.setLinkEditMode(false)
    clearLinkSource()
  }
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

const handleNetworkImported = (_plan: ImportPlan): void => {
  isLinkEditMode.value = false
  draw.setLinkEditMode(false)
  clearLinkSource()
  selectedNode.value = undefined
  clearNodeSearch()
  activeTagId.value = null
  draw.setActiveTagId(null)
  importNetwork()
}

onMounted(async (): Promise<void> => {
  updatePageHeight()
  await nextTick()
  requestAnimationFrame(() => {
    renderGraph()
  })
  window.addEventListener('resize', resizeWorkspace)
  window.addEventListener('keydown', handleWorkspaceKeydown)
})

onBeforeUnmount((): void => {
  window.removeEventListener('resize', resizeWorkspace)
  window.removeEventListener('keydown', handleWorkspaceKeydown)
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
          :revision="graphRevision"
          @saveNetwork="saveNetwork"
          @addNetwork="addNetwork"
          @removeNetwork="removeNetwork"
          @switchNetwork="switchNetwork"
        )
          template(#actions)
            .network-menu-actions
              button.button.is-small.is-light(type="button" title="Импорт и экспорт сети" @click="openTransferModal")
                span.icon
                  i.fa.fa-file-arrow-down
              button.button.is-small.is-info(type="button" title="Добавить контакт" :disabled="!graphService.canAddNode()" @click="addNode")
                span.icon
                  i.fa.fa-user-plus
              PremiumAccessButton(v-if="!graphService.canAddNode()")
              button.button.is-small(
                type="button"
                :class="isLinkEditMode ? 'is-link' : 'is-light'"
                :title="isLinkEditMode ? 'Завершить работу со связями' : 'Добавить или удалить связь на графе'"
                @click="toggleLinkEditMode"
              )
                span.icon
                  i.fa.fa-link
                span.is-hidden-mobile Связь
      .link-mode-hint.tag.is-info.is-light(v-if="isLinkEditMode")
        i.fa.fa-link.mr-1
        | {{ linkSourceNode ? 'Выберите второй узел' : 'Выберите первый узел или связь' }}

      form.node-search(
        :class="{'is-node-control-open': selectedNode}"
        @submit.prevent="selectFirstSearchNode"
      )
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
          :class="{'is-info': activeInfoPanel === 'pcm'}"
          type="button"
          title="PCM-карта сети"
          @click="toggleInfoPanel('pcm')"
        )
          span.icon
            i.fa.fa-compass
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
            | Данные хранятся в браузере и сохраняются автоматически — обычно примерно через 1,5 секунды после изменения.
          .content.info-guide
            p.has-text-weight-semibold Как использовать мымру
            ul
              li Создавайте контакты кнопкой "Добавить" и отмечайте PCM-цвет, тип контакта, теги и описание.
              li Включите режим «Связь» и выберите два узла на графе, чтобы добавить или удалить связь.
              li Используйте функциональные круги для группировки контактов по близости: поддержка, продуктивность, развитие.
              li Открывайте теги снизу, выбирайте активный тег и быстро подсвечивайте связанные с ним ноды на графе.
              li На вкладке волшебной палочки можно отправить текст и получить предположение о PCM-типе контакта.
      .card.info-panel(v-if="activeInfoPanel === 'pcm'")
        header.card-header
          p.card-header-title PCM-карта сети
          button.card-header-icon(type="button" title="Закрыть" aria-label="Закрыть" @click="activeInfoPanel = null")
            span.delete
        .card-content
          p.pcm-network-overview-description
            | Сводка только по заполненным PCM-гипотезам. Она помогает выбрать бережный формат общей встречи, но не оценивает и не определяет людей.
          .pcm-network-overview
            .pcm-network-overview-heading
              span.icon
                i.fa.fa-compass
              strong Обзор гипотез
              span.tag.is-light {{ pcmHintStats.total }} из {{ pcmHintStats.scopeTotal }}
            .pcm-network-scope(v-if="isPremium && pcmScopeTags.length")
              span PCM-группа
              .tags
                button.tag(type="button" :class="{'is-selected': pcmScopeTagId === null}" @click="setPcmScopeTag(null)") Вся сеть
                button.tag(
                  v-for="tag in pcmScopeTags"
                  :key="tag.id"
                  type="button"
                  :class="{'is-selected': pcmScopeTagId === tag.id}"
                  @click="setPcmScopeTag(tag.id)"
                ) {{ tag.name }}
            p.help(v-if="!pcmHintStats.total") Откройте контакт и заполните вкладку с компасом, чтобы собрать обзор без предположений о незаполненных данных.
            template(v-else)
              .tags.pcm-network-types(v-if="pcmHintStats.byFilter.length")
                span.tag(v-for="item in pcmHintStats.byFilter" :key="item.value" :style="{'--pcm-filter-color': item.color}")
                  span.icon
                    i.fa(:class="item.icon")
                  span {{ item.label }} · {{ item.count }}
              .pcm-basic-statistics-note(v-if="!isPremium")
                span Базовая сводка показывает распределение фильтров. Полная карта среды, потребностей и групп доступна в Premium.
                PremiumAccessButton
              template(v-else)
                .pcm-network-needs(v-if="pcmHintStats.byNeed.length")
                  .pcm-network-needs__title Отмеченные потребности
                  .tags
                    span.tag(v-for="item in pcmHintStats.byNeed" :key="item.label") {{ item.label }} · {{ item.count }}
                .pcm-environment-map
                  .pcm-environment-title Предпочтительная среда
                  .pcm-environment-grid
                    .pcm-environment-axis.is-top Внутренний стимул
                    .pcm-environment-cell.is-involved
                      strong Вовлечён
                      span {{ pcmHintStats.environment.innerInvolved }}
                    .pcm-environment-cell.is-distant
                      strong Дистанцирован
                      span {{ pcmHintStats.environment.innerDistant }}
                    .pcm-environment-axis.is-bottom Внешний стимул
                    .pcm-environment-cell.is-involved
                      strong Вовлечён
                      span {{ pcmHintStats.environment.outerInvolved }}
                    .pcm-environment-cell.is-distant
                      strong Дистанцирован
                      span {{ pcmHintStats.environment.outerDistant }}
                p.help(v-if="pcmHintStats.environment.incomplete")
                  | Для {{ pcmHintStats.environment.incomplete }} гипотез ещё не задана среда.
                .pcm-meeting-suggestions(v-if="pcmMeetingSuggestions.length")
                  .pcm-meeting-suggestions__heading
                    span.icon
                      i.fa.fa-people-group
                    strong Формат встречи
                  ul
                    li(v-for="suggestion in pcmMeetingSuggestions" :key="suggestion") {{ suggestion }}
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

    .workspace-payment
      PaymentMethodsButton
      PremiumAccessButton

  NetworkTransferModal(
    v-if="isTransferModalOpen"
    :graph-service="graphService"
    :network-id="networkId"
    :network-name="currentNetwork?.name ?? 'Основная'"
    @close="closeTransferModal"
    @imported="handleNetworkImported"
  )

Teleport(to="body")
  Transition(name="save-toast")
    .save-toast(v-if="isSaved" role="status" aria-live="polite")
      span.icon
        i.fa.fa-check
      span Сохранено
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

.graph-container .nodes circle.is-tag-highlighted,
.graph-container .nodes circle.is-search-highlighted,
.graph-container .nodes circle.is-link-action-source {
  animation: node-highlight-pulse 1.6s ease-in-out infinite;
  vector-effect: non-scaling-stroke;
}

.graph-container .nodes circle.is-tag-highlighted {
  --node-highlight-color: var(--app-tag-highlight);
}

.graph-container .nodes circle.is-search-highlighted {
  --node-highlight-color: var(--app-search-highlight);
}

.graph-container .nodes circle.is-link-action-source {
  --node-highlight-color: #23d160;
}

.graph-container .links line.is-link-editable {
  cursor: pointer;
}

@keyframes node-highlight-pulse {
  0%,
  100% {
    stroke: var(--node-highlight-color);
    stroke-width: 5px;
    filter: drop-shadow(0 0 1px var(--node-highlight-color));
  }

  50% {
    stroke: var(--node-highlight-color);
    stroke-width: 11px;
    filter: drop-shadow(0 0 7px var(--node-highlight-color));
  }
}

.workspace-topbar,
.node-search,
.node-control-panel,
.info-dock,
.workspace-payment {
  position: absolute;
  z-index: 5;
}

.workspace-topbar {
  top: 0.25rem;
  left: 0.5rem;
  right: 0.5rem;
  min-width: 0;
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

.save-toast {
  position: fixed;
  top: 1rem;
  left: 50%;
  z-index: 2000;
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  padding: 0.6rem 0.85rem;
  border: 1px solid #23d160;
  border-radius: 999px;
  background: var(--app-surface);
  box-shadow: var(--app-shadow);
  color: #167a3e;
  font-size: 0.9rem;
  font-weight: 600;
  pointer-events: none;
  transform: translateX(-50%);
}

.save-toast-enter-active,
.save-toast-leave-active {
  transition: opacity 160ms ease, transform 160ms ease;
}

.save-toast-enter-from,
.save-toast-leave-to {
  opacity: 0;
  transform: translate(-50%, -0.5rem);
}

.link-mode-hint {
  align-self: center;
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

.node-search .control.is-expanded,
.node-search .input {
  min-width: 0;
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

@media screen and (min-width: 769px) and (max-width: 1100px) {
  .node-search {
    right: 0.5rem;
    left: auto;
    width: 220px;
    transform: none;
  }
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

.workspace-payment {
  right: 0.5rem;
  bottom: 0.5rem;
  display: flex;
  align-items: center;
  gap: 0.35rem;
  pointer-events: auto;
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

.pcm-network-overview {
  margin-top: 1rem;
  padding-top: 0.9rem;
  border-top: 1px solid var(--app-border);
}

.pcm-network-overview-heading {
  display: flex;
  align-items: center;
  gap: 0.35rem;
  margin-bottom: 0.55rem;
}

.pcm-network-overview-description {
  margin: 0 0 0.75rem;
  color: var(--app-text-muted);
  font-size: 0.8rem;
  line-height: 1.4;
}

.pcm-network-overview-heading .tag {
  margin-left: auto;
}

.pcm-network-types {
  margin-bottom: 0.8rem;
}

.pcm-network-types .tag {
  border-color: color-mix(in srgb, var(--pcm-filter-color) 48%, var(--app-border));
  background: color-mix(in srgb, var(--pcm-filter-color) 12%, var(--app-surface));
  color: var(--app-text);
}

.pcm-network-types .icon {
  color: var(--pcm-filter-color);
}

.pcm-network-scope {
  display: flex;
  align-items: flex-start;
  gap: 0.45rem;
  margin-bottom: 0.7rem;
  color: var(--app-text-muted);
  font-size: 0.76rem;
}

.pcm-network-scope > span {
  flex: 0 0 auto;
  padding-top: 0.34rem;
}

.pcm-network-scope .tags {
  margin-bottom: 0;
}

.pcm-network-scope .tag {
  min-height: 1.8rem;
  border: 1px solid var(--app-border);
  background: var(--app-surface-muted);
  color: var(--app-text);
  cursor: pointer;
}

.pcm-network-scope .tag.is-selected {
  border-color: var(--app-accent);
  background: color-mix(in srgb, var(--app-accent) 15%, var(--app-surface));
  box-shadow: inset 0 0 0 1px color-mix(in srgb, var(--app-accent) 35%, transparent);
  font-weight: 700;
}

.pcm-network-needs {
  margin-bottom: 0.8rem;
}

.pcm-basic-statistics-note {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.6rem;
  margin-top: 0.75rem;
  padding: 0.65rem;
  border: 1px solid color-mix(in srgb, #e7a621 45%, var(--app-border));
  border-radius: 0.5rem;
  background: color-mix(in srgb, #e7a621 10%, var(--app-surface-muted));
  color: var(--app-text-muted);
  font-size: 0.78rem;
  line-height: 1.35;
}

.pcm-network-needs__title {
  margin-bottom: 0.4rem;
  color: var(--app-text-muted);
  font-size: 0.76rem;
  font-weight: 700;
}

.pcm-network-needs .tags {
  margin-bottom: 0;
}

.pcm-environment-map {
  padding: 0.7rem;
  border: 1px solid var(--app-border);
  border-radius: 0.55rem;
  background: var(--app-surface-muted);
}

.pcm-environment-title {
  margin-bottom: 0.45rem;
  color: var(--app-text-muted);
  font-size: 0.78rem;
  font-weight: 700;
}

.pcm-environment-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 0.35rem;
}

.pcm-environment-axis {
  grid-column: 1 / -1;
  color: var(--app-text-muted);
  font-size: 0.72rem;
  text-align: center;
}

.pcm-environment-axis.is-bottom {
  margin-top: 0.2rem;
}

.pcm-environment-cell {
  display: flex;
  align-items: center;
  justify-content: space-between;
  min-height: 2rem;
  padding: 0.35rem 0.5rem;
  border: 1px solid var(--app-border);
  border-radius: 0.4rem;
  background: var(--app-surface);
  font-size: 0.78rem;
}

.pcm-environment-cell span {
  min-width: 1.35rem;
  text-align: center;
  font-weight: 700;
}

.pcm-meeting-suggestions {
  margin-top: 0.75rem;
  padding: 0.7rem;
  border: 1px solid color-mix(in srgb, var(--app-accent) 35%, var(--app-border));
  border-radius: 0.55rem;
  background: color-mix(in srgb, var(--app-accent) 9%, var(--app-surface-muted));
}

.pcm-meeting-suggestions__heading {
  display: flex;
  align-items: center;
  gap: 0.4rem;
  margin-bottom: 0.45rem;
  font-size: 0.8rem;
}

.pcm-meeting-suggestions__heading .icon {
  color: var(--app-accent);
}

.pcm-meeting-suggestions ul {
  display: grid;
  gap: 0.35rem;
  margin: 0;
  padding-left: 1.1rem;
  color: var(--app-text-muted);
  font-size: 0.78rem;
  line-height: 1.35;
}

.info-panel .message,
.info-panel .notification {
  margin-bottom: 0;
}

@media screen and (max-width: 768px) {
  .workspace-topbar {
    right: auto;
    width: calc(100vw - 1rem);
    flex-direction: column;
  }

  .network-menu {
    width: 100%;
    min-width: 0;
    max-width: 100%;
    box-sizing: border-box;
    overflow: hidden;
  }

  .network-menu-actions {
    flex: 0 0 auto;
    padding-top: 0;
  }

  .node-control-panel {
    top: 0.35rem;
    right: 0.35rem;
    bottom: 0.35rem;
    left: 0.35rem;
    width: auto;
    height: auto;
    max-width: none;
    max-height: none;
    border-radius: 6px;
  }

  .node-search {
    position: relative;
    top: auto;
    left: auto;
    width: 100%;
    max-width: 100%;
    transform: none;
    pointer-events: auto;
  }

  .node-search.is-node-control-open {
    display: none;
  }

  .link-mode-hint {
    align-self: flex-start;
  }

  .node-search-empty {
    flex-wrap: wrap;
  }

  .info-dock {
    right: 0.35rem;
    width: auto;
  }

  .workspace-payment {
    right: 0.35rem;
    bottom: 3.5rem;
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

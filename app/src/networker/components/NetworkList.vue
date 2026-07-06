<script setup lang="ts">
import {computed, ref} from "vue";
import {Network} from "@/networker/entity/graph/network";
import type {RouteLocationNormalizedLoaded} from "vue-router";
import type {GraphService} from "@/networker/service/graphService";
import {NODE_TYPE_OPTIONS} from "@/networker/entity/graph/nodeType";

const props = defineProps<{
  currentNetwork?: Network;
  networks: Network[];
  graphService: GraphService;
}>()

const emit = defineEmits([
  'addNetwork', 'removeNetwork', 'saveNetwork', 'switchNetwork'
])

const editActiveIndex = ref(false)
const isStatsOpen = ref(false)
const defaultItem = ref(new Network({id: 0, name: 'Основная'}))

const currentRoute = (r: RouteLocationNormalizedLoaded, i: Network): boolean => {
  if (r.params.id !== undefined && r.params.id !== '') {
    return r.params.id === i.id + ''
  }

  return i.id === 0
}

const switchNetwork = (item: Network): void => {
  editActiveIndex.value = false
  emit('switchNetwork', item)
}

const editMode = (): void => {
  editActiveIndex.value = true
}

const saveNetwork = (): void => {
  editActiveIndex.value = false
  emit('saveNetwork')
}

const addNetwork = (): void => {
  editActiveIndex.value = true
  emit('addNetwork')
}

const removeNetwork = (network: Network): void => {
  emit('removeNetwork', network)
}

const isMaximumCount = (): boolean => {
  return props.networks.length >= 3
}

const nodesCount = computed((): number => props.graphService.nodes.length)

const dataSizeMb = computed((): string => {
  const dto = {
    nodes: props.graphService.nodes,
    links: props.graphService.links,
    circles: props.graphService.funcCircles,
    tags: props.graphService.tags,
  }
  const sizeBytes = new TextEncoder().encode(JSON.stringify(dto)).length
  return (sizeBytes / 1024 / 1024).toFixed(3)
})

const typeStats = computed((): {
  label: string;
  count: number;
  color?: string;
  iconKind?: string;
  iconClass?: string;
}[] => {
  const countByType = new Map<string, number>()
  let withoutTypeCount = 0

  props.graphService.nodes.forEach(node => {
    if (!node.nodeType) {
      withoutTypeCount += 1
      return
    }

    countByType.set(node.nodeType, (countByType.get(node.nodeType) ?? 0) + 1)
  })

  const stats = NODE_TYPE_OPTIONS.map(option => ({
    label: option.label,
    count: countByType.get(option.code) ?? 0,
    color: option.color,
    iconKind: option.iconKind,
    iconClass: option.iconClass,
  }))

  if (withoutTypeCount > 0) {
    stats.push({label: 'Без типа', count: withoutTypeCount, iconClass: 'fa-question'})
  }

  return stats
})
</script>

<template lang="pug">
  .network-list
    .tabs.is-boxed
      ul
        li(:class="{'is-active': currentRoute($route, defaultItem)}")
          a(@click="switchNetwork(defaultItem)")
            span {{ defaultItem.name }}

        template(v-for="(item, index) in props.networks" :key="index")
          li(:class="{'is-active': currentRoute($route, item)}")
            a(@click="switchNetwork(item)")
              span.mr-1 {{ item.name }}

        //li(v-if="!isMaximumCount()")
        //  a(@click="addNetwork")
        //    span
        //      i.fa.fa-plus

    .network-stats
      button.button.is-small.is-light(type="button" @click="isStatsOpen = !isStatsOpen")
        span.icon
          i.fa(:class="isStatsOpen ? 'fa-chevron-down' : 'fa-chevron-right'")
        span Сводка сети
      .network-stats-body(v-if="isStatsOpen")
        .tags.has-addons
          span.tag.is-light Ноды
          span.tag.is-info {{ nodesCount }}
        .tags.has-addons
          span.tag.is-light Данные
          span.tag.is-link {{ dataSizeMb }} МБ
        .tags.network-type-stats
          span.tag.network-type-stat(
            v-for="item in typeStats"
            :key="item.label"
            :title="item.label"
            :style="item.color ? {borderColor: item.color, backgroundColor: item.color, color: '#ffffff'} : undefined"
          )
            span.icon
              svg.network-type-icon(v-if="item.iconKind === 'connector'" viewBox="-10 -10 20 20" aria-hidden="true")
                line(x1="-5" y1="0" x2="5" y2="0")
                circle(cx="-5" cy="0" r="2")
                circle(cx="5" cy="0" r="2")
              svg.network-type-icon(v-else-if="item.iconKind === 'condenser'" viewBox="-10 -10 20 20" aria-hidden="true")
                line(x1="-5" y1="0" x2="-1.5" y2="0")
                line(x1="1.5" y1="0" x2="5" y2="0")
                line(x1="-1.5" y1="-5" x2="-1.5" y2="5")
                line(x1="1.5" y1="-5" x2="1.5" y2="5")
              i.fa(v-else :class="item.iconClass")
            span.ml-1.has-text-weight-semibold {{ item.count }}

    template(v-if="props.currentNetwork && props.currentNetwork.id !== 0")
      .field.has-addons(v-if="editActiveIndex")
        .control
          input.input(v-model="props.currentNetwork.name" type='text' placeholder="Название")
        .control
          button.button(@click="saveNetwork")
            span.has-text-success
              i.fa.fa-check
        .control
          button.button(@click="removeNetwork(props.currentNetwork)")
            span.has-text-danger
              i.fa.fa-trash
      .mb-2(v-else)
        span.mr-1 {{ props.currentNetwork.name }}
        span.is-hoverable(@click="editMode")
          i.fa.fa-pencil
</template>

<style scoped>
.network-list {
  min-width: 0;
  width: 100%;
}

.network-list .tabs {
  max-width: 100%;
  overflow-x: auto;
}

.network-list .tabs ul {
  flex-wrap: nowrap;
}

.network-stats {
  margin-top: 0.35rem;
}

.network-stats-body {
  margin-top: 0.5rem;
}

.network-stats-body .tags {
  margin-bottom: 0.35rem;
}

.network-type-stats {
  gap: 0.35rem;
}

.network-type-stat {
  border: 1px solid transparent;
}

.network-type-icon {
  width: 1rem;
  height: 1rem;
  fill: none;
  stroke: currentColor;
  stroke-width: 1.7px;
  stroke-linecap: round;
  stroke-linejoin: round;
}
</style>

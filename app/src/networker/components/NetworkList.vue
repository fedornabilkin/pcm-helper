<script setup lang="ts">
import {computed, nextTick, ref, watch} from "vue";
import {Network} from "@/networker/entity/graph/network";
import type {RouteLocationNormalizedLoaded} from "vue-router";
import type {GraphService} from "@/networker/service/graphService";
import {NODE_TYPE_OPTIONS} from "@/networker/entity/graph/nodeType";
import {MAX_NETWORK_COUNT} from "@/networker/service/networkService";

const props = defineProps<{
  currentNetwork?: Network;
  networks: Network[];
  graphService: GraphService;
  revision: number;
}>()

const emit = defineEmits([
  'addNetwork', 'removeNetwork', 'saveNetwork', 'switchNetwork'
])

const isEditingName = ref(false)
const networkNameDraft = ref('')
const networkNameInput = ref<HTMLInputElement | null>(null)
const networkPendingDeletion = ref<Network | null>(null)
const defaultItem = ref(new Network({id: 0, name: 'Основная'}))

const currentRoute = (r: RouteLocationNormalizedLoaded, i: Network): boolean => {
  if (r.params.id !== undefined && r.params.id !== '') {
    return r.params.id === i.id + ''
  }

  return i.id === 0
}

const switchNetwork = (item: Network): void => {
  isEditingName.value = false
  emit('switchNetwork', item)
}

const editMode = async (): Promise<void> => {
  if (!props.currentNetwork || props.currentNetwork.id === 0) {
    return
  }

  networkNameDraft.value = props.currentNetwork.name
  isEditingName.value = true
  await nextTick()
  networkNameInput.value?.focus()
  networkNameInput.value?.select()
}

const saveNetwork = (): void => {
  const name = networkNameDraft.value.trim()
  if (!name) {
    return
  }

  isEditingName.value = false
  emit('saveNetwork', name)
}

const cancelEdit = (): void => {
  isEditingName.value = false
  networkNameDraft.value = props.currentNetwork?.name ?? ''
}

const addNetwork = async (): Promise<void> => {
  if (isMaximumCount()) {
    return
  }

  emit('addNetwork')
  await nextTick()
  await editMode()
}

const requestNetworkRemoval = (network: Network): void => {
  if (network.id === 0) {
    return
  }

  isEditingName.value = false
  networkPendingDeletion.value = network
}

const cancelNetworkRemoval = (): void => {
  networkPendingDeletion.value = null
}

const confirmNetworkRemoval = (): void => {
  const network = networkPendingDeletion.value
  if (!network) {
    return
  }

  networkPendingDeletion.value = null
  emit('removeNetwork', network)
}

const isMaximumCount = (): boolean => {
  return props.networks.length + 1 >= MAX_NETWORK_COUNT
}

watch(
  () => props.currentNetwork?.id,
  (): void => {
    isEditingName.value = false
    networkNameDraft.value = props.currentNetwork?.name ?? ''
  },
)

const nodesCount = computed((): number => {
  props.revision
  return props.graphService.nodes.length
})

const linksCount = computed((): number => {
  props.revision
  return props.graphService.links.length
})

const dataSize = computed((): string => {
  props.revision
  const dto = {
    nodes: props.graphService.nodes,
    links: props.graphService.links,
    circles: props.graphService.funcCircles,
    tags: props.graphService.tags,
  }
  const sizeBytes = new TextEncoder().encode(JSON.stringify(dto)).length
  const sizeKb = sizeBytes / 1024

  if (sizeKb < 1024) {
    return `${Math.max(0.1, sizeKb).toFixed(1)} КБ`
  }

  return `${(sizeKb / 1024).toFixed(2)} МБ`
})

const typeStats = computed((): {
  label: string;
  count: number;
  color?: string;
  iconKind?: string;
  iconClass?: string;
}[] => {
  props.revision
  const countByType = new Map<string, number>()
  let withoutTypeCount = 0

  props.graphService.nodes.forEach(node => {
    if (!node.nodeType) {
      withoutTypeCount += 1
      return
    }

    countByType.set(node.nodeType, (countByType.get(node.nodeType) ?? 0) + 1)
  })

  const stats = NODE_TYPE_OPTIONS
    .map(option => ({
      label: option.label,
      count: countByType.get(option.code) ?? 0,
      color: option.color,
      iconKind: option.iconKind,
      iconClass: option.iconClass,
    }))
    .filter(item => item.count > 0)

  if (withoutTypeCount > 0) {
    stats.push({label: 'Без типа', count: withoutTypeCount, iconClass: 'fa-question'})
  }

  return stats
})
</script>

<template lang="pug">
  .network-list
    .network-switcher
      .tabs.is-small.is-toggle.is-toggle-rounded
        ul
          li(:class="{'is-active': currentRoute($route, defaultItem)}")
            a(@click="switchNetwork(defaultItem)")
              span {{ defaultItem.name }}

          template(v-for="item in props.networks" :key="item.id")
            li(:class="{'is-active': currentRoute($route, item)}")
              a(@click="switchNetwork(item)")
                span {{ item.name }}

          li.network-add-tab(v-if="!isMaximumCount()")
            a(
              role="button"
              title="Добавить сеть"
              @click="addNetwork"
            )
              span.icon.is-small
                i.fa.fa-plus
              span.is-hidden-mobile Новая

      button.button.is-small.is-light.network-edit-button(
        v-if="props.currentNetwork && props.currentNetwork.id !== 0"
        type="button"
        title="Переименовать сеть"
        aria-label="Переименовать сеть"
        @click="editMode"
      )
        span.icon.is-small
          i.fa.fa-pencil

      slot(name="actions")

    form.network-name-editor(v-if="isEditingName" @submit.prevent="saveNetwork")
      .field.has-addons
        .control.is-expanded.has-icons-left
          input.input.is-small(
            ref="networkNameInput"
            v-model="networkNameDraft"
            type="text"
            maxlength="80"
            placeholder="Название сети"
            aria-label="Название сети"
            @keydown.esc.prevent="cancelEdit"
          )
          span.icon.is-small.is-left
            i.fa.fa-diagram-project
        .control
          button.button.is-small.is-success(
            type="submit"
            title="Сохранить название"
            aria-label="Сохранить название"
            :disabled="!networkNameDraft.trim()"
          )
            span.icon.is-small
              i.fa.fa-check
        .control
          button.button.is-small(
            type="button"
            title="Отменить"
            aria-label="Отменить"
            @click="cancelEdit"
          )
            span.icon.is-small
              i.fa.fa-xmark
        .control
          button.button.is-small.is-danger.is-light(
            type="button"
            title="Удалить сеть"
            aria-label="Удалить сеть"
            @click="requestNetworkRemoval(props.currentNetwork)"
          )
            span.icon.is-small
              i.fa.fa-trash

    .network-summary
      span.network-metric(title="Контакты")
        span.icon.is-small
          i.fa.fa-user
        strong {{ nodesCount }}
      span.network-metric(title="Связи")
        span.icon.is-small
          i.fa.fa-link
        strong {{ linksCount }}
      span.network-metric(title="Размер данных")
        span.icon.is-small
          i.fa.fa-database
        strong {{ dataSize }}
      span.network-type-stat(
        v-for="item in typeStats"
        :key="item.label"
        :title="`${item.label}: ${item.count}`"
        :style="item.color ? {borderColor: item.color, color: item.color} : undefined"
      )
        span.icon.is-small
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
        strong {{ item.count }}

    .modal(:class="{'is-active': networkPendingDeletion}")
      .modal-background(@click="cancelNetworkRemoval")
      .modal-card.network-delete-modal
        header.modal-card-head
          p.modal-card-title Удалить сеть?
          button.delete(
            type="button"
            aria-label="Закрыть"
            @click="cancelNetworkRemoval"
          )
        section.modal-card-body
          p
            | Сеть «
            strong {{ networkPendingDeletion?.name }}
            | » будет удалена.
          .notification.is-danger.is-light.network-delete-warning
            | Все контакты, связи, теги и функциональные круги этой сети будут удалены без возможности восстановления.
        footer.modal-card-foot.network-delete-actions
          button.button(type="button" @click="cancelNetworkRemoval") Отмена
          button.button.is-danger(type="button" @click="confirmNetworkRemoval")
            span.icon
              i.fa.fa-trash
            span Удалить
</template>

<style scoped>
.network-list {
  min-width: 0;
  width: 100%;
}

.network-switcher {
  display: flex;
  align-items: center;
  gap: 0.35rem;
}

.network-list .tabs {
  flex: 1;
  min-width: 0;
  max-width: 100%;
  margin-bottom: 0;
  overflow-x: auto;
  scrollbar-width: thin;
}

.network-list .tabs ul {
  flex-wrap: nowrap;
}

.network-list .tabs a {
  min-height: 2rem;
  padding: 0.25rem 0.65rem;
}

.network-edit-button {
  flex: 0 0 auto;
}

.network-name-editor {
  margin-top: 0.35rem;
}

.network-name-editor .field {
  margin-bottom: 0;
}

.network-name-editor .control.is-expanded,
.network-name-editor .input {
  min-width: 0;
}

.network-summary {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 0.3rem;
  margin-top: 0.35rem;
}

.network-metric,
.network-type-stat {
  min-height: 1.6rem;
  display: inline-flex;
  align-items: center;
  gap: 0.2rem;
  padding: 0.15rem 0.4rem;
  border: 1px solid var(--app-border);
  border-radius: 999px;
  background: var(--app-surface-muted);
  color: var(--app-text-muted);
  font-size: 0.75rem;
  line-height: 1;
}

.network-metric .icon,
.network-type-stat .icon {
  width: 1rem;
  height: 1rem;
}

.network-metric strong,
.network-type-stat strong {
  color: currentColor;
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

.network-delete-modal {
  width: min(480px, calc(100vw - 2rem));
}

.network-delete-warning {
  margin-top: 1rem;
  margin-bottom: 0 !important;
}

.network-delete-actions {
  justify-content: flex-end;
}
</style>

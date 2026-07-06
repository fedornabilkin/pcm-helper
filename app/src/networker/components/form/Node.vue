<script setup lang="ts">
import {PcmEntity} from "@/networker/entity/graph/pcm";
import type {Node as EntityNode} from "@/networker/entity/graph/node";
import {NODE_TYPE_OPTIONS} from "@/networker/entity/graph/nodeType";
import type {NodeTypeOption} from "@/networker/entity/graph/nodeType";
import type {NodeTypeCode} from "@/networker/entity/graph/nodeType";

const props = defineProps<{
  node: EntityNode;
}>()
const emit = defineEmits(['change', 'remove'])

const vFocus = {
  mounted: (el: HTMLInputElement) => el.focus()
}

const change = (): void => {
  emit('change')
}

const remove = (): void => {
  emit('remove')
}

const setFill = (pcm: PcmEntity): void => {
  props.node.setPcm(pcm)
  change()
}

const setNodeType = (nodeType: NodeTypeCode): void => {
  props.node.nodeType = nodeType
  change()
}

const resetNodeType = (): void => {
  props.node.nodeType = null
  change()
}

const getNodeTypeButtonStyle = (nodeType: NodeTypeOption): Record<string, string> => {
  if (props.node.nodeType === nodeType.code) {
    return {
      borderColor: nodeType.color,
      backgroundColor: nodeType.color,
      color: '#ffffff',
    }
  }

  return {
    borderColor: nodeType.color,
    color: nodeType.color,
  }
}

const filters = [
  new PcmEntity({filter:{name: 'logic', label: 'Логик', class: 'is-info', color: '#479df8'}}),
  new PcmEntity({filter:{name: 'persistent', label: 'Упорный', class: 'is-link', color: '#9d3cf1'}}),
  new PcmEntity({filter:{name: 'soulful', label: 'Душевный', class: 'is-primary', color: '#ef8f37'}}),
  new PcmEntity({filter:{name: 'dreamer', label: 'Мечтатель', class: 'is-success', color: '#9d6436'}}),
  new PcmEntity({filter:{name: 'rebel', label: 'Бунтарь', class: 'is-warning', color: '#edda52'}}),
  new PcmEntity({filter:{name: 'activist', label: 'Деятель', class: 'is-danger', color: '#e69492'}}),
  new PcmEntity({filter:{name: 'none', label: '', class: 'is-dark', color: '#a4b6b2'}}),
]

</script>

<template lang="pug">
  div(v-if="props.node")
    .field.has-addons
      .control
        input.input(v-model="props.node.name" type="text" @keyup="change" v-focus)
      .control
        button.button(@click="remove")
          span.has-text-danger
            i.fa.fa-trash &nbsp;
            | Удалить

    .field
      .control
        textarea.textarea(
          v-model="props.node.description"
          rows="4"
          @input="change"
          placeholder="Описание"
        )

    .field
      .control
        label.checkbox
          input(v-model="props.node.fixed" type="checkbox")
          | Закрепить

    .tags
      input(v-model="props.node.fill" type="color" @change="change")
      span.tag.is-hoverable(
        v-for="(pcm, index) in filters"
        :key="index"
        :class="[pcm.filter.class, {['is-delete']: !pcm.filter.label}]"
        @click="setFill(pcm)"
      ) {{ pcm.filter.label }}

    .field.node-type-field
      label.label Тип контакта
      .buttons.are-small
        button.button.node-type-button(
          v-for="nodeType in NODE_TYPE_OPTIONS"
          :key="nodeType.code"
          type="button"
          :title="nodeType.label"
          :aria-label="nodeType.label"
          :style="getNodeTypeButtonStyle(nodeType)"
          @click="setNodeType(nodeType.code)"
        )
          span.icon
            svg.node-type-svg-icon(v-if="nodeType.iconKind === 'connector'" viewBox="-10 -10 20 20" aria-hidden="true")
              line(x1="-5" y1="0" x2="5" y2="0")
              circle(cx="-5" cy="0" r="2")
              circle(cx="5" cy="0" r="2")
            svg.node-type-svg-icon(v-else-if="nodeType.iconKind === 'condenser'" viewBox="-10 -10 20 20" aria-hidden="true")
              line(x1="-5" y1="0" x2="-1.5" y2="0")
              line(x1="1.5" y1="0" x2="5" y2="0")
              line(x1="-1.5" y1="-5" x2="-1.5" y2="5")
              line(x1="1.5" y1="-5" x2="1.5" y2="5")
            i.fa(v-else :class="nodeType.iconClass")
        button.button.is-light.node-type-button(
          type="button"
          title="Сбросить тип контакта"
          aria-label="Сбросить тип контакта"
          :disabled="!props.node.nodeType"
          @click="resetNodeType"
        )
          span.icon
            i.fa.fa-rotate-left

</template>

<style scoped>
.node-type-field {
  margin-top: 0.75rem;
}

.node-type-button {
  width: 2.25rem;
  height: 2.25rem;
}

.node-type-svg-icon {
  width: 1.1rem;
  height: 1.1rem;
  fill: none;
  stroke: currentColor;
  stroke-width: 1.7px;
  stroke-linecap: round;
  stroke-linejoin: round;
}
</style>

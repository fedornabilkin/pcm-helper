<script setup lang="ts">
import {Node} from "../../entity/graph/node.ts";
import {Link} from "../../entity/graph/link.ts";
import {ref, watch} from "vue";

const props = defineProps(['node', 'nodes', 'links'])
const emit = defineEmits(['add', 'remove', 'change'])

const linkModel = ref(undefined)
const activeLinkIndex = ref(null)
let unAvailableNodeIds = ref(new Set())

watch(() => props.node, () => {
  unAvailableNodeIds.value.clear()
  linkModel.value = undefined
  activeLinkIndex.value = null
})

const setCurrentLink = (item: Link, index: any): void => {
  linkModel.value = item
  activeLinkIndex.value = index
}

const isCurrentNode = (item: Node): boolean => {
  if(!props.node) return false
  return item.id === props.node.id
}

const isActiveLink = (item: Link): boolean => {
  const checkSource = item.source.id === props.node.id
  const checkTarget = item.target.id === props.node.id
  if (checkSource) {
    unAvailableNodeIds.value.add(item.target.id)
  }
  if (checkTarget) {
    unAvailableNodeIds.value.add(item.source.id)
  }
  return checkSource || checkTarget
}

const isAvailableNode = (node: Node): boolean => {
  return !unAvailableNodeIds.value.has(node.id)
}

const change = (): void => {
  emit('change')
}

const add = (node: Node): void => {
  unAvailableNodeIds.value.add(node.id)
  emit('add', node)
}

const remove = (link: Link): void => {
  const nodeId = (props.node.id === link.source.id) ? link.target.id : link.source.id
  if(nodeId) {
    unAvailableNodeIds.value.delete(nodeId)
  }
  linkModel.value = undefined
  activeLinkIndex.value = null
  emit('remove', link)
}

const setDistance = (dist: number): void => {
  linkModel.value.distance = dist.distance
  change()
}

const setStroke = (color: string): void => {
  linkModel.value.stroke = color.color
  change()
}

const distance = [
  {name: 'support', label: 'Поддержка', distance: 80},
  {name: 'production', label: 'Продуктивность', distance: 200},
  {name: 'evolution', label: 'Развитие', distance: 350},
  {name: 'oblivion', label: 'Забвение', distance: 600},
]

const colors = [
  {name: 'red', label: '', color: '#ea3525'},
  {name: 'green', label: '', color: '#397f24'},
  {name: 'gray', label: '', color: '#818181'},
]

</script>

<template lang="pug">
  .columns.is-multiline
    .column
      .mb-1 {{props.node.getName()}}
      .field.is-grouped.is-grouped-multiline
        template(v-for="(link, index) in props.links")
          .control(v-if="isActiveLink(link)")
            .tags.has-addons
              span.tag.is-hoverable(:class="{'is-dark': index === activeLinkIndex}" :key="index" @click="setCurrentLink(link, index)") {{ link.source.getName() }} -> {{ link.target.getName() }}
              span.tag.is-delete.is-hoverable(@click="remove(link)")
      hr
      .field.is-grouped.is-grouped-multiline
        template(v-for="node in props.nodes")
          .control(v-if="isAvailableNode(node)")
            .tags.has-addons
              span.tag(:class="{ 'is-dark': isCurrentNode(node) }") {{ node.getName() }}
              span.tag.is-hoverable(v-if="!isCurrentNode(node)" @click="add(node)") +

    .column(v-if="linkModel")
      .field.has-addons
        .control
          input.input(v-model="linkModel.distance" type='number' @change="change" min="50" max="1000" step="10")
        .control.is-expanded
          input.input(v-model="linkModel.stroke" type='color' @change="change")
      .tags
        span.tag.is-hoverable(v-for="(dist, index) in distance" :key="index")
          span(@click="setDistance(dist)") {{ dist.label }}

      .tags
        span.tag.is-hoverable(
          v-for="(color, index) in colors"
          :key="index"
          :class="color.name"
          @click="setStroke(color)"
        )
</template>

<style scoped>
.tags .tag.red {background-color: #ea3525}
.tags .tag.green {background-color: #397f24}
.tags .tag.gray {background-color: #818181}
</style>
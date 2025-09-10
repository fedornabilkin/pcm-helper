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
  return props.node.isMyLink(item, (second: number) => {
    unAvailableNodeIds.value.add(second)
  })
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
  {name: 'red', label: 'r', color: '#ea3525'},
  {name: 'green', label: 'g', color: '#397f24'},
  {name: 'gray', label: 'x', color: '#818181'},
]

</script>

<template lang="pug">
  .is-block
    .is-block(v-if="linkModel")
      .field.has-addons
        .control
          input.input(v-model="linkModel.distance" type='number' @change="change" min="50" max="1000" step="10")
        .control.is-expanded
          input.input(v-model="linkModel.stroke" type='color' @change="change")
        .control(v-for="(color, index) in colors" :key="index")
          button.button(@click="setStroke(color)" :class="color.name") {{color.label}}
      .tags.has-addons
        input.tag(v-model="linkModel.status" type="checkbox" @change="change")
        span.tag.is-hoverable(v-for="(dist, index) in distance" :key="index")
          span(@click="setDistance(dist)") {{dist.label}}

      hr
    .columns.is-multiline
      .column
        .field.is-grouped.is-grouped-multiline
          template(v-for="(link, index) in props.links")
            .control(v-if="isActiveLink(link)")
              .tags.has-addons
                span.tag.is-hoverable(:class="{'is-dark': index === activeLinkIndex}" :key="index" @click="setCurrentLink(link, index)") {{ link.source.getName() }} -> {{ link.target.getName() }}
                span.tag.is-delete.is-hoverable(@click="remove(link)")

      .column
        .field.is-grouped.is-grouped-multiline
          template(v-for="node in props.nodes")
            .control(v-if="isAvailableNode(node)")
              .tags.has-addons
                span.tag(:class="{ 'is-dark': isCurrentNode(node) }") {{ node.getName() }}
                span.tag.is-hoverable(v-if="!isCurrentNode(node)" @click="add(node)") +
</template>

<style scoped>
button.button.red {background-color: #ea3525; color: #ea3525;}
button.button.green {background-color: #397f24; color: #397f24;}
button.button.gray {background-color: #818181; color: #818181;}
</style>
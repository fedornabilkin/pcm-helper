<script setup lang="ts">
import Node from "@/networker/components/form/Node.vue";
import NodeLink from "@/networker/components/form/NodeLink.vue"
import {ref} from "vue";

const props = defineProps([
  'currentNode',
  'nodes',
  'links',
  'circle',
  'entityType',
])
const emit = defineEmits([
  'change',
  'addNode',
  'removeNode',
  'addLink',
  'removeLink',
])

const activeTab = ref(1)

const setActiveTab = (idx: number): void => {
  activeTab.value = idx
}

const change = (): void => {
  emit('change')
}

const addNode = (): void => {
  activeTab.value = 1
  emit('addNode')
}

const removeNode = (): void => {
  activeTab.value = 0
  emit('removeNode')
}

const addLink = (node): void => {
  emit('addLink', node)
}

const removeLink = (link): void => {
  emit('removeLink', link)
}
</script>

<template lang="pug">
  .panel
    .panel-block
      .is-centered
        button.button.mb-2(@click="addNode") Добавить
    .panel-tabs(v-if="props.currentNode" )
      a(:class="{'is-active': activeTab === 1}" @click="setActiveTab(1)")
        i.fa.fa-user
      a(:class="{'is-active': activeTab === 2}" @click="setActiveTab(2)")
        i.fa.fa-link

    .panel-block(v-if="activeTab === 1")
      node(
        :node="props.currentNode"
        @change="change"
        @remove="removeNode"
      )

    .panel-block(v-if="activeTab === 2")
      node-link(
        :node="props.currentNode"
        :nodes="props.nodes"
        :links="props.links"
        @change="change"
        @add="addLink"
        @remove="removeLink"
      )

</template>

<style>
</style>
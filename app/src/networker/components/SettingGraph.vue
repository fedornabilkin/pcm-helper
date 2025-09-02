<script setup lang="ts">
import Node from "@/networker/components/form/Node.vue";
import NodeLink from "@/networker/components/form/NodeLink.vue"
import {ref} from "vue";
import Fact from "@/networker/components/form/Fact.vue";
import {Fact as EntityFact} from "@/networker/entity/graph/Fact.ts"

const props = defineProps([
  'currentNode',
  'nodes',
  'links',
  'currentFact',
  'circle',
  'entityType',
])
const emit = defineEmits([
  'change',
  'addNode', 'removeNode',
  'addLink', 'removeLink',
  'addFact', 'removeFact',
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

const addFact = (): void => {
  emit('addFact')
}

const removeFact = (fact: EntityFact): void => {
  emit('removeFact', fact)
}
</script>

<template lang="pug">
  .mr-1
    button.button.mb-2(@click="addNode") Добавить
    .is-pulled-right Контактов: {{ props.nodes.length }}
  .panel(v-if="props.currentNode" )
    .panel-tabs
      a(:class="{'is-active': activeTab === 1}" @click="setActiveTab(1)")
        i.fa.fa-user
      a(:class="{'is-active': activeTab === 2}" @click="setActiveTab(2)")
        i.fa.fa-link
      a(:class="{'is-active': activeTab === 3}" @click="setActiveTab(3)")
        i.fa.fa-file

    .panel-block(v-if="activeTab === 1")
      Node(
        :node="props.currentNode"
        @change="change"
        @remove="removeNode"
      )

    .panel-block(v-if="activeTab === 2")
      NodeLink(
        :node="props.currentNode"
        :nodes="props.nodes"
        :links="props.links"
        @change="change"
        @add="addLink"
        @remove="removeLink"
      )

    .panel-block(v-if="activeTab === 3")
      Fact(
        :fact="props.currentFact"
        :node="props.currentNode"
        @change="change"
        @add="addFact"
        @remove="removeFact"
      )

</template>

<style>
</style>
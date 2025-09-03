<script setup lang="ts">
import Node from "@/networker/components/form/Node.vue";
import NodeLink from "@/networker/components/form/NodeLink.vue"
import {ref} from "vue";
import Fact from "@/networker/components/form/Fact.vue";
import {Fact as EntityFact} from "@/networker/entity/graph/Fact.ts"

const props = defineProps(['links', 'circle', 'graphService'])
const emit = defineEmits([
  'change',
  'addNode', 'removeNode',
  'changeLink',
  'changeFact'
])

const activeTab = ref(1)
const currentNode = ref<Node | undefined>(undefined)
props.graphService.cbActiveNode = (node: Node) => {
  currentNode.value = node
}

const currentFact = ref<EntityFact | undefined>(undefined);


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
  props.graphService.addLink(node);
  emit('changeLink', node)
}

const removeLink = (link): void => {
  props.graphService.removeLink(link);
  emit('changeLink', link)
}

const addFact = (): void => {
  currentFact.value = props.graphService.addFact(currentNode.value)
  emit('changeFact')
}

const saveFact = (): void => {
  currentFact.value = undefined
  emit('changeFact')
}

const removeFact = (fact: EntityFact): void => {
  props.graphService.removeFact(currentNode.value, fact)
  currentFact.value = undefined
  emit('changeFact')
}
</script>

<template lang="pug">
  .mr-1
    button.button.mb-2(@click="addNode") Добавить
    .is-pulled-right Контактов: {{ props.graphService.getNodesCount() }}
  .panel(v-if="currentNode")
    .panel-tabs
      a(:class="{'is-active': activeTab === 1}" @click="setActiveTab(1)")
        i.fa.fa-user
      a(:class="{'is-active': activeTab === 2}" @click="setActiveTab(2)")
        i.fa.fa-link
      a(:class="{'is-active': activeTab === 3}" @click="setActiveTab(3)")
        i.fa.fa-file

    .panel-block(v-if="activeTab === 1")
      Node(
        :node="currentNode"
        @change="change"
        @remove="removeNode"
      )

    .panel-block(v-if="activeTab === 2")
      NodeLink(
        :node="currentNode"
        :nodes="props.graphService.nodes"
        :links="props.links"
        @change="change"
        @add="addLink"
        @remove="removeLink"
      )

    .panel-block(v-if="activeTab === 3")
      Fact(
        :fact="currentFact"
        :node="currentNode"
        @change="change"
        @add="addFact"
        @remove="removeFact"
        @save="saveFact"
      )

</template>

<style>
</style>
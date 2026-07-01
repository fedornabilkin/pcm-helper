<script setup lang="ts">
import Node from "@/networker/components/form/Node.vue";
import NodeLink from "@/networker/components/form/NodeLink.vue"
import {ref} from "vue";
import Fact from "@/networker/components/form/Fact.vue";
import {Fact as EntityFact} from "@/networker/entity/graph/Fact"
import Tag from "@/networker/components/form/Tag.vue";
import {Tag as EntityTag} from "@/networker/entity/graph/tag"

const props = defineProps(['links', 'circle', 'graphService'])
const emit = defineEmits([
  'change', 'close',
  'addNode', 'removeNode',
  'changeLink', 'changeFact', 'changeTag',
])

const activeTab = ref(1)
const currentNode = ref<Node | undefined>(props.graphService.getCurrentNode())
props.graphService.cbActiveNode = (node: Node) => {
  currentNode.value = node
}

const currentFact = ref<EntityFact | undefined>(undefined);


const setActiveTab = (idx: number): void => {
  activeTab.value = idx
}

const filterClass = (item: Node): string => {
  return item.pcm?.filter.class ?? ''
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

const addTag = (tag: any): void => {
  props.graphService.addTag(tag)
  emit('changeTag')
}

const removeTag = (tag: EntityTag): void => {
  props.graphService.removeTag(tag)
  emit('changeTag')
}

const bindTag = (tag: EntityTag): void => {
  props.graphService.bindTag(tag, currentNode.value)
  emit('changeTag')
}

const unbindTag = (tag: EntityTag): void => {
  props.graphService.unbindTag(tag, currentNode.value)
  emit('changeTag')
}

const close = (): void => {
  currentNode.value = undefined
  currentFact.value = undefined
  emit('close')
}

const filterTag = (tag: Tag): void => {
  //console.log(tag)
}

</script>

<template lang="pug">
  //.field.is-grouped.is-grouped-multiline
    template(v-for="tag in props.graphService.tags")
      .control
        span.tag.is-hoverable(@click="filterTag(tag)") {{ tag.name }}
  .mr-1
    button.button.mb-2(@click="addNode")
      i.fa.fa-plus
      span.pl-1 Добавить

    .is-pulled-right Контактов: {{ props.graphService.getNodesCount() }}

  .panel(v-if="currentNode" :class="filterClass(currentNode)")
    .panel-heading {{ currentNode.getName() }}
      button.button.is-pulled-right(@click="close")
        i.fa.fa-close
    .panel-tabs
      a(:class="{'is-active': activeTab === 1}" @click="setActiveTab(1)")
        i.fa.fa-user
      a(:class="{'is-active': activeTab === 2}" @click="setActiveTab(2)")
        i.fa.fa-link
      a(:class="{'is-active': activeTab === 3}" @click="setActiveTab(3)")
        i.fa.fa-file
      a(:class="{'is-active': activeTab === 4}" @click="setActiveTab(4)")
        i.fa.fa-tag

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

    .panel-block(v-if="activeTab === 4")
      Tag(
        :node="currentNode"
        :tags="props.graphService.tags"
        @bindTag="bindTag"
        @unbindTag="unbindTag"
        @add="addTag"
        @remove="removeTag"
      )

</template>

<style>
</style>

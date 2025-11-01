<script setup lang="ts">
import Node from "@/networker/components/form/Node.vue";
import NodeLink from "@/networker/components/form/NodeLink.vue"
import {ref} from "vue";
import Fact from "@/networker/components/form/Fact.vue";
import {Fact as EntityFact} from "@/networker/entity/graph/Fact.ts"
import {JsonFileAdapter} from "@/networker/service/transfer/fileAdapter.ts";

const props = defineProps(['links', 'circle', 'graphService'])
const emit = defineEmits([
  'change', 'close',
  'addNode', 'removeNode',
  'changeLink',
  'changeFact',
  'exportNetwork', 'importNetwork',
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

const close = (): void => {
  currentNode.value = undefined
  currentFact.value = undefined
  emit('close')
}

const exportNetwork = (): void => {
  props.graphService.setFileAdapter(new JsonFileAdapter())
  const dataUri = "data:text/json;charset=utf-8," + encodeURIComponent(props.graphService.export());
  const anchorElement = document.createElement('a');
  anchorElement.href = dataUri;
  anchorElement.download = `pcm-helper-${(new Date()).getTime()}.json`;
  document.body.appendChild(anchorElement);
  anchorElement.click();
  document.body.removeChild(anchorElement);

  emit('exportNetwork')
}

const importNetwork = (event): void => {
  const file = event.target.files[0];
  const reader = new FileReader();

  reader.onload = e => {
    const data = JSON.parse(e.target.result);
    props.graphService.setFileAdapter(new JsonFileAdapter())
    props.graphService.import(e.target.result)
    event.target.value = ''

    emit('importNetwork')
  };

  reader.onerror = (e) => {
    console.error('Ошибка FileReader:', e);
  };

  reader.readAsText(file);
}
</script>

<template lang="pug">
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


  .message
    .message-body
      | Импорт/экспорт данных в формате JSON. При импорте все старые данные будут перезаписаны без возможности восстановления.
      | Перед импортом всегда экспортируйте свои данные в резервный файл для возможности восстановления.
      .columns.mt-1
        .column
          button.button(@click="exportNetwork")
            i.fa.fa-arrow-right-to-file
            span.pl-1 Экспорт
        .column
          span Импорт
          input.input(type="file" @change="importNetwork")

</template>

<style>
</style>
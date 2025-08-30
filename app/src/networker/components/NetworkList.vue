<script setup lang="ts">
import {ref} from "vue";
import {Network} from "@/networker/entity/graph/network.ts";

const props = defineProps(['currentNetwork', 'networks'])
const emit = defineEmits([
    'addNetwork', 'removeNetwork', 'saveNetwork', 'switchNetwork'
])

const editActiveIndex = ref(false)
const defaultItem = ref(new Network({id: 0, name: 'Основная'}))

const currentRoute = (r: any, i: Network): boolean => {
  if (r.params.id !== undefined && r.params.id !== '') {
    return r.params.id === i.id + ''
  }
  else if(i.id === 0) {
    return true
  }
  return false
}

const switchNetwork = (item: Netword): void => {
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

</script>
<template lang="pug">
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

<style></style>

<script setup lang="ts">
import {PcmEntity} from "@/networker/entity/graph/pcm.ts";

const props = defineProps(['node'])
const emit = defineEmits(['change', 'remove'])

const vFocus = {
  mounted: (el) => el.focus()
}

const change = (): void => {
  emit('change')
}

const remove = (): void => {
  emit('remove')
}

const setFill = (pcm: any): void => {
  props.node.setPcm(pcm)
  change()
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
        input.input(v-model="props.node.description" type='text' @keyup="change" placeholder="Описание")

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

</template>

<style>
</style>
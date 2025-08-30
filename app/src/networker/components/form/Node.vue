<script setup lang="ts">
const props = defineProps(['node'])
const emit = defineEmits(['change', 'remove'])

const change = (): void => {
  emit('change')
}

const remove = (): void => {
  emit('remove')
}

const setFill = (filter: any): void => {
  props.node.fill = filter.color
  change()
}

const filters = [
  {name: 'logic', label: 'Логик', class: 'is-info', color: '#479df8'},
  {name: 'persistent', label: 'Упорный', class: 'is-link', color: '#9d3cf1'},
  {name: 'soulful', label: 'Душевный', class: 'is-primary', color: '#ef8f37'},
  {name: 'dreamer', label: 'Мечтатель', class: 'is-success', color: '#9d6436'},
  {name: 'rebel', label: 'Бунтарь', class: 'is-warning', color: '#edda52'},
  {name: 'activist', label: 'Деятель', class: 'is-danger', color: '#e69492'},
]

</script>

<template lang="pug">
  div(v-if="props.node")
    .field.has-addons
      .control
        input.input(v-model="props.node.name" type='text' @keyup="change")
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

    .field
      .control
        input(v-model="props.node.fill" type="color")

    .tags
      span.tag.is-hoverable(v-for="(filter, index) in filters" :key="index" :class="filter.class")
        span(@click="setFill(filter)") {{ filter.label }}

</template>

<style>
</style>
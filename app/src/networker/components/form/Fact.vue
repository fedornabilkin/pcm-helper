<script setup lang="ts">

import {Fact} from "@/networker/entity/graph/Fact.ts";

const props = defineProps(['node', 'fact'])
const emit = defineEmits(['change', 'add', 'remove', 'save'])

const vFocus = {
  mounted: (el) => el.focus()
}

const change = (): void => {
  emit('change')
}

const save = (): void => {
  emit('save')
}

const remove = (fact: Fact): void => {
  emit('remove', fact)
}

const add = (): void => {
  emit('add')
}

</script>

<template lang="pug">
  div
    .field.has-addons
      .control
        button.button.mt-2(@click="add")
          i.fa.fa-plus
      .control(v-if="props.fact")
        input.input(v-model="props.fact.description" v-focus @keyup="change" placeholder="Небольшой факт")
      .control(v-if="props.fact")
        button.button(@click="save")
          i.fa.fa-check

    .is-flex.is-flex-direction-column-reverse
      div(v-for="(fact, index) in props.node.facts" :key="index")
        span.pr-1 {{fact.description}}
        span
          i.fa.fa-trash.has-text-danger(@click="remove(fact)")
</template>

<style>
</style>
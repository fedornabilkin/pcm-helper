<script setup lang="ts">

import {Fact} from "@/networker/entity/graph/Fact.ts";
import {computed} from "vue";

const props = defineProps(['node', 'fact'])
const emit = defineEmits(['change', 'add', 'remove'])

const items = computed(() => props.node.facts.reverse())

const change = (): void => {
  emit('change')
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
        input.input(v-model="props.fact.description" @keyup="change" placeholder="Небольшой факт")
    .is-flex.is-flex-direction-column-reverse
      div(v-for="(fact, index) in props.node.facts" :key="index")
        span.pr-1 {{fact.description}}
        span
          i.fa.fa-trash.has-text-danger(@click="remove(fact)")
</template>

<style>
</style>
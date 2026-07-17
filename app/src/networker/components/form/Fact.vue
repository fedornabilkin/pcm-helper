<script setup lang="ts">
import {ref} from "vue";
import {Fact} from "@/networker/entity/graph/Fact";

const props = defineProps(['node'])
const emit = defineEmits(['add', 'remove'])
const draft = ref('')

const vFocus = {
  mounted: (el: HTMLInputElement) => el.focus(),
}

const remove = (fact: Fact): void => {
  emit('remove', fact)
}

const add = (): void => {
  const description = draft.value.trim()
  if (!description) return

  emit('add', description)
  draft.value = ''
}
</script>

<template lang="pug">
.fact-form
  form(@submit.prevent="add")
    .field
      .control.is-expanded
        input.input(
          v-model="draft"
          v-focus
          placeholder="Добавить факт и нажать Enter"
          aria-label="Добавить факт"
        )
    button.button.is-small.is-success.fact-submit(
      type="submit"
      title="Добавить факт"
      aria-label="Добавить факт"
      :disabled="!draft.trim()"
    )
      span.icon.is-small
        i.fa.fa-check

  .is-flex.is-flex-direction-column-reverse
    div(v-for="fact in props.node.facts" :key="fact.id")
      span.pr-1 {{fact.description}}
      span(v-if="fact.description.trim()")
        i.fa.fa-trash.has-text-danger(@click="remove(fact)")
</template>

<style scoped>
.fact-form,
.fact-form form {
  width: 100%;
}

.fact-form .field {
  margin-bottom: 0.75rem;
}

.fact-form .control,
.fact-form .input {
  width: 100%;
}

.fact-submit {
  display: none;
}

@media screen and (max-width: 768px) {
  .fact-form form {
    text-align: right;
  }

  .fact-submit {
    display: inline-flex;
    margin-top: -0.25rem;
  }
}
</style>

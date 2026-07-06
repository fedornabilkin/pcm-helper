<script setup lang="ts">
import {ref} from "vue";
import type {GraphService} from "@/networker/service/graphService";
import type {Tag} from "@/networker/entity/graph/tag";

const props = defineProps<{
  graphService: GraphService;
  activeTagId?: number | null;
}>()

const emit = defineEmits<{
  change: [];
  select: [tag: Tag];
}>()
const tagName = ref('')

const addTag = (): void => {
  const name = tagName.value.trim()
  if (!name) {
    return
  }

  props.graphService.addTag({name})
  tagName.value = ''
  emit('change')
}

const removeTag = (tag: Tag): void => {
  props.graphService.removeTag(tag)
  emit('change')
}

const selectTag = (tag: Tag): void => {
  emit('select', tag)
}
</script>

<template lang="pug">
  .card
    header.card-header
      p.card-header-title Теги
    .card-content
      .field.has-addons
        .control.is-expanded
          input.input(
            v-model="tagName"
            type="text"
            placeholder="Название тега"
            @keyup.enter="addTag"
          )
        .control
          button.button.is-info(type="button" :disabled="!tagName.trim()" @click="addTag")
            span.icon
              i.fa.fa-plus
      .tags(v-if="props.graphService.tags.length")
        span.tag.is-medium.is-hoverable(
          v-for="tag in props.graphService.tags"
          :key="tag.id"
          :class="{'is-info': props.activeTagId === tag.id}"
          @click="selectTag(tag)"
        )
          span {{ tag.name }}
          button.delete.is-small(type="button" title="Удалить тег" @click.stop="removeTag(tag)")
      p.help(v-else) Теги пока не созданы.
</template>

<style scoped>
.tag {
  gap: 0.35rem;
}
</style>

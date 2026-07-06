<script setup lang="ts">
import {ref, watch} from "vue";
import {Tag} from "../../entity/graph/tag";

const props = defineProps(['node', 'tags'])
const emit = defineEmits(['bindTag', 'unbindTag'])

const tags = ref<Tag[]>([])

const refreshTags = (): void => {
  tags.value = Array.isArray(props.tags)
    ? props.tags.filter((tag: Tag | undefined): tag is Tag => Boolean(tag?.id))
    : []
}

watch(() => props.node, refreshTags, {immediate: true})
watch(() => props.tags, refreshTags)

const isActiveTag = (item: Tag): boolean => {
  return Boolean(props.node?.tags?.includes(item.id))
}

const isAvailableTag = (item: Tag): boolean => {
  return !isActiveTag(item)
}

const bindTag = (tag: Tag): void => {
  emit('bindTag', tag)
}

const unbindTag = (tag: Tag): void => {
  emit('unbindTag', tag)
}
</script>

<template lang="pug">
  .is-block
    p.help(v-if="!tags.length") Сначала создайте теги в нижней панели управления тегами.
    .field.is-grouped.is-grouped-multiline(v-else)
      template(v-for="tag in tags" :key="tag.id")
        .control
          span.tag.is-hoverable(v-if="isAvailableTag(tag)" @click="bindTag(tag)") {{ tag.name }}
          span.tag.is-hoverable.is-dark(v-if="isActiveTag(tag)" @click="unbindTag(tag)") {{ tag.name }}
</template>

<style scoped>
</style>

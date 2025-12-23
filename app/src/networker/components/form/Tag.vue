<script setup lang="ts">
import {Node} from "../../entity/graph/node.ts";
import {ref, watch} from "vue";
import {Tag} from "../../entity/graph/tag.ts";

const props = defineProps(['node', 'tags'])
const emit = defineEmits(['add', 'remove', 'bindTag', 'unbindTag'])

const tagModel = ref({name:''})
const tags = ref<[]>([])
const unAvailableTagIds = ref(new Set())

tags.value = props.tags

watch(() => props.node, () => {
  unAvailableTagIds.value.clear()
  tagModel.value = {name:''}
  tags.value = props.tags
})

const vFocus = {
  mounted: (el) => el.focus()
}

const isActiveTag = (item: Tag): boolean => {
  return props.node.isMyTag(item, (second: number) => {
    unAvailableTagIds.value.add(second)
  })
}

const isAvailableTag = (item: Tag): boolean => {
  return !unAvailableTagIds.value.has(item.id)
}

const add = (): void => {
  const tag = tagModel.value
  //tags.value.push(tag)
  emit('add', tag)
}

const remove = (tag: Tag): void => {
  emit('remove', tag)
}

const bindTag = (tag: Tag): void => {
  unAvailableTagIds.value.add(tag.id)
  emit('bindTag', tag)
}

const unbindTag = (tag: Tag): void => {
  unAvailableTagIds.value.delete(tag.id)
  emit('unbindTag', tag)
}

</script>

<template lang="pug">
  .is-block
    .field.has-addons
      .control()
        input.input(v-model="tagModel.name" v-focus placeholder="Название")
      .control()
        button.button(@click="add")
          i.fa.fa-check
    hr
    .columns.mt-2
      .column
        .field.is-grouped.is-grouped-multiline
          template(v-for="tag in tags")
            .control
              span.tag.is-hoverable(v-if="isAvailableTag(tag)" @click="bindTag(tag)") {{ tag.name }}
              span.tag.is-hoverable.is-dark(v-if="isActiveTag(tag)" @click="unbindTag(tag)") {{ tag.name }}
</template>

<style scoped>
</style>
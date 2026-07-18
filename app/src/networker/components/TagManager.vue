<script setup lang="ts">
import {computed, ref} from "vue";
import type {GraphService} from "@/networker/service/graphService";
import type {Tag} from "@/networker/entity/graph/tag";
import {usePremiumAccess} from '@/core/composable/access/premiumAccess'
import PremiumAccessButton from '@/components/monetisation/PremiumAccessButton.vue'

const props = defineProps<{
  graphService: GraphService;
  activeTagId?: number | null;
}>()

const emit = defineEmits<{
  change: [];
  select: [tag: Tag];
  close: [];
}>()
const tagName = ref('')
const tagToRemove = ref<Tag | null>(null)
const {getLimit: getAccessLimit} = usePremiumAccess()
const tagLimit = computed(() => getAccessLimit('tagsPerNetwork'))
const isTagLimitReached = computed(() => !props.graphService.canAddTag())

const addTag = (): void => {
  const name = tagName.value.trim()
  if (!name) {
    return
  }

  const tag = props.graphService.addTag({name})
  if (!tag) {
    return
  }
  tagName.value = ''
  emit('change')
}

const removeTag = (tag: Tag): void => {
  tagToRemove.value = tag
}

const confirmRemoveTag = (): void => {
  if (!tagToRemove.value) {
    return
  }

  props.graphService.removeTag(tagToRemove.value)
  tagToRemove.value = null
  emit('change')
}

const cancelRemoveTag = (): void => {
  tagToRemove.value = null
}

const selectTag = (tag: Tag): void => {
  emit('select', tag)
}
</script>

<template lang="pug">
  .card
    header.card-header
      p.card-header-title Теги
      button.card-header-icon(type="button" title="Закрыть" aria-label="Закрыть" @click="emit('close')")
        span.delete
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
          button.button.is-info(type="button" :disabled="!tagName.trim() || !props.graphService.canAddTag()" @click="addTag")
            span.icon
              i.fa.fa-plus
      p.help {{ props.graphService.tags.length }} / {{ tagLimit }} тегов
      .tag-limit-notice(v-if="isTagLimitReached")
        span Лимит новых тегов достигнут.
        PremiumAccessButton
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

    .modal(:class="{'is-active': tagToRemove}")
      .modal-background(@click="cancelRemoveTag")
      .modal-card
        header.modal-card-head
          p.modal-card-title Удалить тег?
          button.delete(type="button" aria-label="close" @click="cancelRemoveTag")
        section.modal-card-body
          p Тег будет удален из списка и снят со всех узлов, где он используется.
          p.has-text-weight-semibold(v-if="tagToRemove") {{ tagToRemove.name }}
        footer.modal-card-foot
          button.button.is-danger(type="button" @click="confirmRemoveTag") Удалить
          button.button(type="button" @click="cancelRemoveTag") Отмена
</template>

<style scoped>
.tag {
  gap: 0.35rem;
}

.tag-limit-notice {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.5rem;
  margin: 0.45rem 0 0.7rem;
  color: var(--app-text-muted);
  font-size: 0.75rem;
}
</style>

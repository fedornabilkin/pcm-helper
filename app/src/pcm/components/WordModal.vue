<script setup>
import TagList from "@/pcm/components/TagList.vue";

const props = defineProps(['isActive', 'item'])
const emit = defineEmits(['close'])
const item = props.item

const close = () => {
  emit('close')
}

</script>

<template lang="pug">
.modal(:class="{'is-active': props.isActive}")
  .modal-background
  .modal-card
    header.modal-card-head
      p.modal-card-title Ключевые слова {{ item.personalityType }}
      button.delete(aria-label='close' @click='close')
    section.modal-card-body
      TagList(:tagclass="item.backgroundColor()" :tags="item.getVerb()")
      hr
      TagList(:tagclass="item.backgroundColor()" :tags="item.getNoun()")
      hr
      TagList(:tagclass="item.backgroundColor()" :tags="item.getAdjective()")
    footer.modal-card-foot
      button.button(@click='close' :class="item.backgroundColor()" aria-label="close") Закрыть
</template>

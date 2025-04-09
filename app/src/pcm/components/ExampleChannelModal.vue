<script setup>
import TagList from "@/pcm/components/TagList.vue";

const props = defineProps(['isActive', 'item'])
const emit = defineEmits(['close'])
const item = props.item

const concept = item.getExampleConcept()
const good = item.getExampleGood()
const bad = item.getExampleBad()

const close = () => {
  emit('close')
}

</script>

<template lang="pug">
.modal(:class="{'is-active': props.isActive}")
  .modal-background
  .modal-card
    header.modal-card-head
      p.modal-card-title Примеры {{ item.title }}
      button.delete(aria-label='close' @click='close')
    section.modal-card-body
      p Концептуальный пример:
      .mb-1(v-for="example in concept" :key="example.id")
        p - {{ example.i }}
        p - {{ example.r }}
      hr
      span.icon.is-pulled-right
        i.fa.fa-check-square
      .mb-1(v-for="example in good" :key="example.id")
        p - {{ example.i }}
        p - {{ example.r }}
      hr
      span.icon.is-pulled-right
        i.fa.fa-exclamation-triangle
      .mb-1(v-for="example in bad" :key="example.id")
        p - {{ example.i }}
        p - {{ example.r }}

    footer.modal-card-foot
      button.button(@click='close' aria-label="close") Закрыть
</template>

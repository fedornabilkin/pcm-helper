<script setup>

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
      p.modal-card-title Потребности {{ item.personalityType }}
      button.delete(aria-label='close' @click='close')
    section.modal-card-body
      .mb-2(v-for="need in item.getNeeds()")
        .message(:class="item.tagBackground()")
          .message-body
            | {{ need.title }}
        .columns.is-multiline
          .column
            span.icon(:class="item.textColor(item)")
              i.fa.fa-thumbs-up.fa-lg
            | {{ need.good }}
          .column
            span.icon(:class="item.textColor(item)")
              i.fa.fa-thumbs-down
            | {{ need.bad }}
    footer.modal-card-foot
      button.button(@click='close') Закрыть
</template>

<script setup>

const props = defineProps(['isActive', 'item'])
const emit = defineEmits(['close'])

const item = props.item
const stress = item.getDistress()
const steps = stress.steps

const close = () => {
  emit('close')
}

</script>

<template lang="pug">
.modal(:class="{'is-active': props.isActive}")
  .modal-background
  .modal-card
    header.modal-card-head
      p.modal-card-title Уровни стресса {{ item.personalityType }}
      button.delete(aria-label='close' @click='close')
    section.modal-card-body
      .notification.is-light(:class="item.tagBackground()")
        p.subtitle.is-5 Первая ступень
        .mb-1
          b Слова:&nbsp;
          | {{ steps.one.word }}
        .mb-0
          b Поведение:&nbsp;
          | {{ steps.one.behavior }}
      .notification.is-light(:class="item.tagBackground()")
        p.subtitle.is-5 Вторая ступень
        ul(v-for="item in steps.two")
          li - {{ item }}
      .notification.is-light(:class="item.tagBackground()")
        p.subtitle.is-5 Третья ступень
        .mb-1
          b Слова:&nbsp;
          | {{ steps.three.word }}
        .mb-0
          b Поведение:&nbsp;
          | {{ steps.three.behavior }}
    footer.modal-card-foot
      button.button(@click='close') Закрыть
</template>

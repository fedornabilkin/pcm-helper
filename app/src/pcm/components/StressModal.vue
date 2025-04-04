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
      .message(:class="item.backgroundColor()")
        .message-header
          p {{ stress.requirement }}
        .message-body
          span.icon.is-pulled-right
            i.fa.fa-dice-one.fa-2x(aria-hidden="true")
          .mb-1
            b Слова:&nbsp;
            | {{ steps.one.word }}
          .mb-4
            b Поведение:&nbsp;
            | {{ steps.one.behavior }}

          span.icon.is-pulled-right
            i.fa.fa-dice-two.fa-2x(aria-hidden="true")
          ul(v-for="item in steps.two")
            li - {{ item }}
          .mb-4

          span.icon.is-pulled-right
            i.fa.fa-dice-three.fa-2x(aria-hidden="true")
          .mb-1
            b Слова:&nbsp;
            | {{ steps.three.word }}
          .mb-0
            b Поведение:&nbsp;
            | {{ steps.three.behavior }}

    footer.modal-card-foot
      button.button(@click='close' :class="item.backgroundColor()" aria-label="close") Закрыть
</template>

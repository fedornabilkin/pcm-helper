<script setup>
const props = defineProps(['item'])
const item = props.item
</script>

<template lang="pug">
.card
  header.card-header
    p.card-header-title {{ item.title }}
  .card-content
    .mb-2
      span.icon
        i.fa.fa-hands(aria-hidden="true")
      | {{ item.gesture }}
    .mb-2
      span.icon
        i.fa.fa-child-reaching(aria-hidden="true")
      | {{ item.pose }}
    .mb-2
      span.icon
        i.fa.fa-file-lines(aria-hidden="true")
      | {{ item.word }}
    .mb-2
      span.icon
        i.fa.fa-bullhorn(aria-hidden="true")
      | {{ item.voice }}
    .mb-2
      span.icon
        i.fa.fa-ghost(aria-hidden="true")
      | {{ item.face }}
</template>

<style>

</style>
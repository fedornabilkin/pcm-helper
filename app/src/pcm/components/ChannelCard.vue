<script setup>
const props = defineProps(['item'])
const item = props.item
</script>

<template lang="pug">
  .card
    header.card-header
      p.card-header-title {{ item.title }}
    .card-content

      .tags.has-addons.are-large
        span.icon.tag
          i.fa.fa-people-arrows
        span.tag {{ item.initiator }}
        span.tag {{ item.recipient }}
      article.content
        .message
          .message-body {{ item.description }}
</template>

<style>

</style>
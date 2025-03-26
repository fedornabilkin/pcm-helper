<script setup>
const props = defineProps(['tagclass', 'tags'])
</script>

<template lang="pug">
  .tags
    span.tag(v-for="tag in props.tags" :class="props.tagclass")
      | {{ tag }}
</template>

<style scoped>

</style>
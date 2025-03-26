<script setup>
import {ref} from "vue";

const open = ref(false)

const toggleNavigation = () => {
  open.value = !open.value
}

</script>
<template lang="pug">
nav.navbar(role='navigation' aria-label='main navigation')
  //.container
  .navbar-brand
    a.navbar-item(href='/')
      img(src='/logo.png' alt='pcmhelper.ru')
  //  a.navbar-burger.burger(role='button' :class="{ 'is-active': open }" aria-label='menu' aria-expanded='false' @click='toggleNavigation')
  //    span(aria-hidden='true')
  //    span(aria-hidden='true')
  //    span(aria-hidden='true')
  //.navbar-menu(:class="{ 'is-active': open }")
  //  .navbar-end
      //.navbar-item
        ShareButtons
</template>

<style></style>

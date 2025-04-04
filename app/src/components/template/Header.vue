<script setup>
import {ref} from "vue";

const open = ref(false)

const toggleNavigation = () => {
  open.value = !open.value
}

const menuList = {
  filter: {
    anchor: {
      full:'Фильтры восприятия',
      short:'Фильтры',
    },
    route: {
      name: 'main'
    },
    icon: 'fa-filter'
  },
  personality: {
    anchor: {
      full:'Части личности',
      short:'Личности',
    },
    route: {
      name: 'personality'
    },
    icon: 'fa-person-rays'
  },
  channel: {
    anchor: {
      full:'Каналы коммуникации',
      short:'Каналы',
    },
    route: {
      name: 'channel'
    },
    icon: 'fa-tower-cell'
  },
  // interaction: {
  //   anchor: {
  //     full:'Стили управления',
  //     short:'Управление',
  //   },
  //   route: {
  //     name: 'interaction'
  //   },
  //   icon: 'fa-person-military-pointing'
  // },
}

const currentRoute = (r, i) => {
  if (r.name !== undefined) {
    return r.name === i.route.name
  }
  return false
}

const getTitle = (r) => {
  let title = menuList.filter.anchor.full
  const item = menuList[r.name]
  if (item !== undefined) {
    title = item.anchor.full
  }
  return title
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

.tabs.is-centered.is-boxed
  ul
    li(v-for="item in menuList" :key="item.name" :class="{'is-active': currentRoute($route, item)}")
      router-link(:to="{name: item.route.name}")
        span.icon
          i.fa(:class="item.icon" aria-hidden="true")
        span.is-hidden-mobile.is-hidden-desktop {{ item.anchor.short }}
        span.is-hidden-touch {{ item.anchor.full }}
.container.mb-3
  h1.title.is-4 {{ getTitle($route) }}
</template>

<style></style>

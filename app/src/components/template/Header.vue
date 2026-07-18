<script setup lang="ts">
import {computed, onBeforeUnmount, onMounted, ref} from "vue";
import {useRoute} from "vue-router";
import {PCM_HINT_FILTERS} from '@/networker/entity/graph/pcmHint'

const route = useRoute()
const isCompactHeader = computed(() => route.meta.compactHeader === true)
const showPageTitle = computed(() => route.meta.hidePageTitle !== true)
const logoCloudElement = ref<HTMLElement | null>(null)
const logoCloudIcons: (HTMLElement | null)[] = []
const logoCloudPoints = PCM_HINT_FILTERS.map((_, index) => {
  const ratio = (index + 0.5) / PCM_HINT_FILTERS.length
  const polar = Math.acos(1 - 2 * ratio)
  const azimuth = index * Math.PI * (3 - Math.sqrt(5))
  return {
    x: Math.sin(polar) * Math.cos(azimuth),
    y: Math.cos(polar),
    z: Math.sin(polar) * Math.sin(azimuth),
  }
})
let logoCloudFrame: number | undefined
let logoCloudLastFrame = 0
const logoCloudDirections = [
  {x: 0, y: 1, wobbleX: 0.08, wobbleY: 0},
  {x: 0, y: -1, wobbleX: 0.08, wobbleY: 0},
  {x: 1, y: 0, wobbleX: 0, wobbleY: 0.08},
  {x: -1, y: 0, wobbleX: 0, wobbleY: 0.08},
  {x: 0.72, y: 0.72, wobbleX: 0.12, wobbleY: 0.06},
  {x: -0.72, y: 0.72, wobbleX: 0.06, wobbleY: 0.12},
  {x: 0.72, y: -0.72, wobbleX: 0.06, wobbleY: 0.12},
  {x: -0.72, y: -0.72, wobbleX: 0.12, wobbleY: 0.06},
  {x: 0.3, y: 1, wobbleX: 0.2, wobbleY: 0.08},
  {x: 1, y: 0.3, wobbleX: 0.08, wobbleY: 0.2},
  {x: -0.3, y: -1, wobbleX: 0.2, wobbleY: 0.08},
  {x: -1, y: -0.3, wobbleX: 0.08, wobbleY: 0.2},
]
let logoCloudVelocity = {x: 0.00016, y: 0.00026, wobbleX: 0, wobbleY: 0, phase: 0}
let logoCloudDirectionChange = 0

const setLogoCloudIcon = (element: Element | null, index: number): void => {
  logoCloudIcons[index] = element instanceof HTMLElement ? element : null
}

const randomizeLogoCloudDirection = (): void => {
  const direction = logoCloudDirections[Math.floor(Math.random() * logoCloudDirections.length)]
  const speed = 0.0001 + Math.random() * 0.00028
  logoCloudVelocity = {
    x: direction.x * speed,
    y: direction.y * speed,
    wobbleX: direction.wobbleX * speed,
    wobbleY: direction.wobbleY * speed,
    phase: Math.random() * Math.PI * 2,
  }
}

const animateLogoCloud = (time: number): void => {
  const stage = logoCloudElement.value
  if (!stage) {
    logoCloudFrame = requestAnimationFrame(animateLogoCloud)
    return
  }
  const elapsed = Math.min(time - logoCloudLastFrame || 16, 40)
  logoCloudLastFrame = time
  if (time >= logoCloudDirectionChange) {
    randomizeLogoCloudDirection()
    logoCloudDirectionChange = time + 4200 + Math.random() * 4800
  }
  const wave = Math.sin(time / 850 + logoCloudVelocity.phase)
  const rotationX = (logoCloudVelocity.x + logoCloudVelocity.wobbleX * wave) * elapsed
  const rotationY = (logoCloudVelocity.y + logoCloudVelocity.wobbleY * Math.cos(time / 1100 + logoCloudVelocity.phase)) * elapsed
  const radiusX = stage.clientWidth * 0.31
  const radiusY = stage.clientHeight * 0.3

  logoCloudPoints.forEach((point, index) => {
    const rotatedX = point.x * Math.cos(rotationY) - point.z * Math.sin(rotationY)
    const rotatedZ = point.x * Math.sin(rotationY) + point.z * Math.cos(rotationY)
    const rotatedY = point.y * Math.cos(rotationX) - rotatedZ * Math.sin(rotationX)
    const finalZ = point.y * Math.sin(rotationX) + rotatedZ * Math.cos(rotationX)
    point.x = rotatedX
    point.y = rotatedY
    point.z = finalZ

    const icon = logoCloudIcons[index]
    if (!icon) {
      return
    }
    const depth = (point.z + 1) / 2
    const scale = 0.5 + depth * 0.62
    icon.style.transform = `translate(-50%, -50%) translate(${point.x * radiusX}px, ${point.y * radiusY}px) scale(${scale})`
    icon.style.opacity = String(0.3 + depth * 0.7)
    icon.style.filter = `blur(${(1 - depth) * 1.1}px)`
    icon.style.zIndex = String(Math.round(depth * 100))
  })
  logoCloudFrame = requestAnimationFrame(animateLogoCloud)
}

onMounted(() => {
  logoCloudFrame = requestAnimationFrame(animateLogoCloud)
})
onBeforeUnmount(() => {
  if (logoCloudFrame !== undefined) {
    cancelAnimationFrame(logoCloudFrame)
  }
})

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
  interaction: {
    anchor: {
      full:'Стили взаимодействия',
      short:'Стили',
    },
    route: {
      name: 'interaction'
    },
    icon: 'fa-person-military-pointing'
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
  mymraCreation: {
    anchor: {
      full:'Мымра-creation',
      short:'Мымра',
    },
    route: {
      name: 'mymraCreation'
    },
    icon: 'fa-ghost'
  },
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
.app-header(:class="{'is-compact': isCompactHeader}")
  .header-navigation
    nav.navbar(role='navigation' aria-label='main navigation')
      .navbar-brand
        a.navbar-item.app-logo-carousel(href='/' aria-label='pcmhelper.ru — на главную')
          span.app-logo-carousel__track(ref="logoCloudElement")
            span.app-logo-carousel__item(
              v-for="(filter, index) in PCM_HINT_FILTERS"
              :key="filter.value"
              :style="{'--filter-color': filter.color}"
              :ref="element => setLogoCloudIcon(element, index)"
              :title="filter.label"
            )
              i.fa(:class="filter.icon" aria-hidden="true")

    .tabs.is-centered.is-boxed.app-navigation
      ul
        li(v-for="item in menuList" :key="item.name" :class="{'is-active': currentRoute($route, item)}")
          router-link(:to="{name: item.route.name}")
            span.icon
              i.fa(:class="item.icon" aria-hidden="true")
            span.is-hidden-mobile.is-hidden-desktop {{ item.anchor.short }}
            span.is-hidden-touch {{ item.anchor.full }}
  .container.mb-3(v-if="showPageTitle")
    h1.title.is-4 {{ getTitle($route) }}
</template>

<style scoped>
.header-navigation {
  display: flex;
  align-items: flex-start;
  min-width: 0;
}

.header-navigation .navbar {
  flex: 0 0 auto;
  min-height: 2.65rem;
}

.header-navigation .navbar-brand {
  min-height: 2.65rem;
  align-items: center;
}

.header-navigation .navbar-brand .navbar-item {
  min-height: 2.65rem;
  padding: 0.1rem 0.35rem;
}

.app-navigation {
  flex: 1 1 auto;
  min-width: 0;
  margin: 0;
  overflow-x: auto;
  scrollbar-width: thin;
}

.app-navigation ul {
  flex-wrap: nowrap;
}

.app-header.is-compact .navbar {
  display: inline-flex;
  min-height: 2.25rem;
  vertical-align: top;
}

.app-header.is-compact .navbar-brand,
.app-header.is-compact .navbar-item {
  min-height: 2.25rem;
}

.app-header.is-compact .navbar-item {
  padding-bottom: 0.2rem;
  padding-top: 0.2rem;
}

.app-logo-carousel { display: block; box-sizing: border-box; width: 7.3rem; min-width: 7.3rem; height: 2.25rem; padding: 0; overflow: visible; border: 0; border-radius: 0; background: var(--app-surface); box-shadow: none; }
.app-logo-carousel__track { position: relative; display: block; width: 100%; height: 100%; perspective: 60rem; transform-style: preserve-3d; }
.app-logo-carousel__track::before { display: none; }
.app-logo-carousel__item { position: absolute; top: 50%; left: 50%; display: grid; width: 1.55rem; height: 1.55rem; place-items: center; border: 0; border-radius: 0; background: transparent; box-shadow: none; color: var(--filter-color); font-size: 0.96rem; text-shadow: none; transform: translate(-50%, -50%); will-change: transform, opacity, filter; }
.app-logo-carousel__item i { display: inline-block; }

.app-header.is-compact .app-navigation {
  margin-bottom: 0;
}

.app-header.is-compact .app-navigation a {
  padding-bottom: 0.3rem;
  padding-top: 0.3rem;
}

@media screen and (max-width: 768px) {
  .app-header .header-navigation .navbar {
    display: none;
  }

  .app-navigation {
    overflow-x: visible;
  }

  .app-navigation ul {
    justify-content: center;
  }
}

@media (prefers-reduced-motion: reduce) {
  .app-logo-carousel__item { filter: none !important; }
}
</style>

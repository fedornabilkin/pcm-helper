<script setup lang="ts">
import {ref} from 'vue'
import {usePremiumAccess} from '@/core/composable/access/premiumAccess'

const {isPremium, activate} = usePremiumAccess()
const isOpen = ref(false)
const code = ref('')
const error = ref('')
const success = ref('')

const open = (): void => {
  error.value = ''
  success.value = ''
  isOpen.value = true
}

const submit = (): void => {
  const result = activate(code.value)
  if (result.ok) {
    success.value = result.message
    error.value = ''
    code.value = ''
    return
  }
  error.value = result.message
}
</script>

<template lang="pug">
  .premium-access
    button.button.is-small(:class="isPremium ? 'is-warning' : 'is-light'" type="button" @click="open")
      span.icon
        i.fa(:class="isPremium ? 'fa-crown' : 'fa-gem'")
      span {{ isPremium ? 'Premium активен' : 'Premium' }}

    Teleport(to="body")
      .modal(:class="{'is-active': isOpen}")
        .modal-background(@click="isOpen = false")
        .modal-card
          header.modal-card-head
            p.modal-card-title Premium-доступ
            button.delete(type="button" aria-label="Закрыть" @click="isOpen = false")
          section.modal-card-body
            .content
              p Откройте дополнительные лимиты и возможности в текущей сессии браузера.
            .notification.is-warning.is-light(v-if="isPremium")
              span.icon
                i.fa.fa-crown
              span Premium активен до конца текущей сессии браузера.
            form(@submit.prevent="submit")
              .field
                label.label Промокод
                .control
                  input.input(v-model="code" type="text" autocomplete="off" placeholder="Введите промокод" :disabled="isPremium")
              p.help.is-danger(v-if="error") {{ error }}
              p.help.is-success(v-if="success") {{ success }}
              .premium-comparison
                .premium-comparison__column
                  span.premium-comparison__title Базовый
                  ul
                    li 1 сеть
                    li 50 контактов в сети
                    li 5 тегов
                    li Импорт с заменой
                .premium-comparison__column.is-premium
                  span.premium-comparison__title
                    i.fa.fa-crown(aria-hidden="true")
                    | Premium
                  ul
                    li 3 сети
                    li 500 контактов в сети
                    li 50 тегов
                    li Объединение импорта, AI-анализ и полная PCM-карта
              button.button.is-primary(type="submit" :disabled="isPremium") Активировать
          footer.modal-card-foot
            button.button(type="button" @click="isOpen = false") Закрыть
</template>

<style scoped>
.premium-access { display: inline-flex; }
.modal-card { max-width: 33rem; }
.modal-card-body .notification { display: flex; align-items: center; gap: 0.45rem; }
.premium-comparison { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 0.65rem; margin: 1rem 0; }
.premium-comparison__column { padding: 0.7rem; border: 1px solid var(--app-border); border-radius: 0.55rem; background: var(--app-surface-muted); font-size: 0.79rem; }
.premium-comparison__column.is-premium { border-color: color-mix(in srgb, #e7b226 55%, var(--app-border)); background: color-mix(in srgb, #e7b226 10%, var(--app-surface-muted)); }
.premium-comparison__title { display: flex; align-items: center; gap: 0.35rem; margin-bottom: 0.4rem; font-weight: 700; }
.premium-comparison__title .fa-crown { color: #b77900; }
.premium-comparison ul { margin: 0; padding-left: 1.05rem; }
.premium-comparison li + li { margin-top: 0.25rem; }

@media screen and (max-width: 420px) {
  .premium-comparison { grid-template-columns: 1fr; }
}
</style>

<script setup lang="ts">
import {computed} from "vue";
import PaymentMethodsButton from "@/components/monetisation/PaymentMethodsButton.vue";
import PremiumAccessButton from "@/components/monetisation/PremiumAccessButton.vue";
import {useTheme} from "@/core/composable/theme/useTheme";

const {isDarkTheme, toggleTheme} = useTheme()
const themeButtonTitle = computed(() => isDarkTheme.value ? 'Включить светлую тему' : 'Включить тёмную тему')
</script>

<template lang="pug">
footer.footer
  .container
    .columns.is-vcentered.is-multiline
      .column.is-narrow
        PaymentMethodsButton
      .column.is-narrow
        PremiumAccessButton
      .column.is-narrow
        a(href="/") pcmhelper.ru
        | &nbsp;&copy; 2025
      .column.is-narrow.footer-theme-control
        button.button.is-small.is-light(type="button" :title="themeButtonTitle" @click="toggleTheme")
          span.icon
            i.fa(:class="isDarkTheme ? 'fa-sun' : 'fa-moon'")
</template>

<style scoped>
footer.footer {padding-bottom: .5rem; padding-top: .5rem}
.footer-theme-control {margin-left: auto}

@media screen and (min-width: 768px) {
  footer.footer .columns {
    display: flex;
    flex-wrap: nowrap;
  }

  footer.footer .column.is-narrow {
    flex: none;
    width: auto;
  }
}
</style>

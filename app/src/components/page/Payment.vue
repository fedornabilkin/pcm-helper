<script setup lang="ts">
const paymentMethods = [
  {
    id: 'yookassa',
    url: 'https://yookassa.ru/my/i/alph_IfsImSb/l',
    name: 'ЮKassa',
    description: 'Банковские карты, СБП, ЮMoney, SberPay и другие способы оплаты.',
    logoPath: '/monetisation/payment-logos/yookassa.svg',
    logoMethods: [
      '/monetisation/payment-logos/sbp.svg',
      '/monetisation/payment-logos/yoomoney.svg',
      '/monetisation/payment-logos/sberpay.svg',
      '/monetisation/payment-logos/card.svg',
    ],
  },
  {
    id: 'yoomoney',
    url: 'https://yoomoney.ru/fundraise/1J2TQR7145S.260717',
    name: 'ЮMoney',
    description: 'Перевод через страницу сбора средств ЮMoney.',
    logoPath: '/monetisation/payment-logos/yoomoney.svg',
    logoMethods: [
      '/monetisation/payment-logos/yoomoney.svg',
      '/monetisation/payment-logos/sberpay.svg',
      '/monetisation/payment-logos/card.svg',
    ],
  },
]
</script>

<template lang="pug">
.container
  .payment-methods-page
    section.payment-support-message
      h2.payment-support-message__title Спасибо, что помогаете проекту расти
      p
        | PCM Helper — небольшой независимый проект, который развивает один человек. За каждой новой функцией, исправлением и аккуратной деталью стоят время, внимание и желание сделать общение чуть яснее и бережнее.
      p
        | Любая поддержка, даже совсем небольшая, — это тёплый знак: проект нужен. Она даёт возможность спокойно думать о следующем шаге, пробовать новые идеи и быстрее превращать их в полезные обновления. Спасибо, что идёте рядом.

    h2.payment-methods-page__title Способы оплаты
    .columns.is-multiline
      .column.is-half-tablet.is-one-quarter-desktop(v-for="item in paymentMethods" :key="item.id")
        a.no-decoration(:href="item.url" target="_blank" rel="noopener noreferrer")
          article.card.payment-methods-tile
            .card-content
              .payment-methods-tile__logo
                img(:src="item.logoPath" :alt="item.name" loading="lazy")
              h3.payment-methods-tile__name {{ item.name }}
              p.payment-methods-tile__description {{ item.description }}
              .mt-2.payment-methods-tile__methods
                span.logo-method.mr-1(v-for="logo in item.logoMethods" :key="logo")
                  img(:src="logo" :alt="item.name" loading="lazy")

      .column.is-half-tablet.is-one-quarter-desktop
        article.card.payment-methods-tile.payment-qr-card
          .card-content
            h3.payment-methods-tile__name Оплата по QR-коду
            a.payment-qr-link(
              href="https://yookassa.ru/my/i/alph_IfsImSb/l"
              target="_blank"
              rel="noopener noreferrer"
            )
              img(src="/monetisation/qr/yookassa-qr.png" alt="QR-код для оплаты через ЮKassa")
            p.payment-methods-tile__description Отсканируйте QR-код камерой телефона, чтобы открыть оплату через ЮKassa.
</template>

<style scoped>
.payment-methods-page {
  margin-top: 1rem;
}

.payment-support-message {
  max-width: 760px;
  margin-bottom: 2rem;
  padding: 1.25rem;
  border: 1px solid color-mix(in srgb, var(--app-border) 78%, #f0a423);
  border-left: 4px solid #f0a423;
  border-radius: 8px;
  background: linear-gradient(135deg, var(--app-surface), var(--app-surface-muted));
  box-shadow: var(--app-shadow);
}

.payment-support-message__title {
  margin: 0 0 0.75rem;
  font-size: 1.25rem;
}

.payment-support-message p {
  margin: 0;
  color: var(--app-text-muted);
  line-height: 1.55;
}

.payment-support-message p + p {
  margin-top: 0.75rem;
  color: var(--app-text);
  font-weight: 500;
}

.payment-methods-page__title {
  margin-bottom: 1.5rem;
  font-size: 1.5rem;
}

.no-decoration {
  color: inherit;
  text-decoration: none;
}

.payment-methods-tile {
  height: 100%;
  margin-bottom: 20px;
  transition: box-shadow 160ms ease;
}

.no-decoration:hover .payment-methods-tile,
.no-decoration:focus-visible .payment-methods-tile {
  box-shadow: 0 4px 12px rgb(10 10 10 / 15%);
}

.payment-methods-tile__logo {
  display: flex;
  align-items: center;
  min-height: 48px;
  margin-bottom: 1rem;
}

.payment-methods-tile__logo img {
  width: auto;
  max-width: 100%;
  max-height: 48px;
  object-fit: contain;
}

.payment-methods-tile__name {
  margin: 0 0 0.5rem;
  font-size: 1.1rem;
}

.payment-methods-tile__description {
  margin: 0;
  color: var(--app-text-muted);
  font-size: 0.9rem;
  line-height: 1.4;
}

.payment-methods-tile__methods {
  display: flex;
  align-items: center;
  gap: 0.35rem;
}

.logo-method {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 30px;
  height: 26px;
}

.logo-method img {
  display: block;
  width: auto;
  max-width: 34px;
  max-height: 18px;
}

.payment-qr-card {
  text-align: center;
}

.payment-qr-link {
  display: inline-block;
  margin-bottom: 0.75rem;
}

.payment-qr-link img {
  display: block;
  width: 100%;
  max-width: 220px;
  height: auto;
  margin: 0 auto;
}
</style>

<script setup lang="ts">
const paymentLogos = [
  {id: 'sbp', logoPath: '/monetisation/payment-logos/sbp.svg', name: 'СБП'},
  {id: 'yoomoney', logoPath: '/monetisation/payment-logos/yoomoney.svg', name: 'ЮMoney'},
  {id: 'sberpay', logoPath: '/monetisation/payment-logos/sberpay.svg', name: 'SberPay'},
  {id: 'card', logoPath: '/monetisation/payment-logos/card.svg', name: 'Банковская карта'},
]
</script>

<template lang="pug">
.boxb.b
  router-link.payment-methods-button.button(to="/payment" title="Способы оплаты")
    .payment-methods-button__icons
      img.payment-methods-button__icon(
        v-for="item in paymentLogos"
        :key="item.id"
        :src="item.logoPath"
        :alt="item.name"
      )
</template>

<style scoped>
.payment-methods-button {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  flex-wrap: wrap;
  color: inherit;
  text-decoration: none;
}

.payment-methods-button__icons {
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
}

.payment-methods-button__icon {
  width: auto;
  max-width: 56px;
  height: 24px;
  object-fit: contain;
  vertical-align: middle;
}

</style>

<style>
.boxb a.button {
  border-radius: 0.6rem;
  border-color: white;
  box-shadow: none;
}

.boxb {
  --border-angle: 0deg;
  border-radius: 0.6rem;
  display: inline-block;
  justify-content: center;
  align-items: center;
  box-shadow: 0 2px 4px hsl(0 0% 0% / 25%);
  animation: border-angle-rotate 4s infinite linear;
  border: 0.1rem solid transparent;
  position: relative;
}

.boxb::after {
  position: absolute;
  z-index: 1;
  inset: 0;
  padding: 0.1rem;
  border-radius: inherit;
  background: conic-gradient(
    orange,
    #fff,
    #fff,
    #fff,
    #fff,
    #fff,
    #fff,
    orange
  );
  content: '';
  pointer-events: none;
  transform: rotate(0deg);
  animation: payment-border-spin 4s linear infinite;
  -webkit-mask: linear-gradient(#000 0 0) content-box, linear-gradient(#000 0 0);
  -webkit-mask-composite: xor;
  mask-composite: exclude;
}

.boxb.b {
  background: linear-gradient(white, white) padding-box,
    conic-gradient(
      from var(--border-angle),
      orange,
      #fff,
      #fff,
      #fff,
      #fff,
      #fff,
      #fff,
      orange
    ) border-box;
}

@keyframes border-angle-rotate {
  from { --border-angle: 0deg; }
  to { --border-angle: 360deg; }
}

@keyframes payment-border-spin {
  to { transform: rotate(360deg); }
}

@property --border-angle {
  syntax: '<angle>';
  initial-value: 0deg;
  inherits: false;
}

@media screen and (max-width: 480px) {
  .payment-methods-button__icon {
    max-width: 34px;
    height: 20px;
  }

  .payment-methods-button__icons {
    gap: 0.25rem;
  }
}

@media (prefers-reduced-motion: reduce) {
  .boxb,
  .boxb::after { animation: none; }
}
</style>

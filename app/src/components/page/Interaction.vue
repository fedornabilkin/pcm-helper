<script setup>
import InteractionCard from "@/pcm/components/InteractionCard.vue";
import PCM from "@/pcm/service";
import {ref} from "vue";
import {pcmInteraction} from "@/pcm/entity/interaction";
import PcmLearningNav from "@/pcm/components/PcmLearningNav.vue";

const service = new PCM()
const items = ref([])

service.getInteraction()
    .then((result) => {
      for(const node of result) {
        items.value.push(new pcmInteraction(node))
      }
    })
</script>

<template lang="pug">
.container.mb-4
  PcmLearningNav
  section.interaction-guide
    .columns.is-variable.is-4
      .column.is-half
        h2.title.is-5 Стили взаимодействия
        p Выбирайте стиль по ситуации, а не по ярлыку человека: иногда нужна ясная задача, иногда — пространство для мнения, поддержка или самостоятельность.
        h3.interaction-guide__matrix-title Как читать матрицу
        p.interaction-guide__matrix-copy Матрица показывает предпочитаемую среду типов PCM. Горизонтальная ось — отношения: от вовлечённости в людей и команду к большей дистанции и самостоятельности. Вертикальная ось — цели: от внутреннего интереса к внешнему стимулу, результату и возможностям.
        p.interaction-guide__matrix-copy Цветные точки не оценивают человека и не заменяют наблюдение за конкретной ситуацией — они помогают выбрать более подходящий формат взаимодействия.
        .interaction-guide__matrix
          .interaction-guide__axis
            strong Ось целей
            span Насколько сейчас важны ясность, срок и следующий шаг?
          .interaction-guide__axis
            strong Ось отношений
            span Насколько сейчас важны участие, доверие и возможность быть услышанным?
      .column.is-half
        section.identification-matrix
          h3.title.is-6 Идентификационная матрица
          .identification-matrix__canvas(role="img" aria-label="Матрица типов PCM по осям отношений и целей")
            span.identification-matrix__label.identification-matrix__label--top Внутренний стимул
            span.identification-matrix__label.identification-matrix__label--bottom Внешний стимул
            span.identification-matrix__label.identification-matrix__label--left Вовлечён
            span.identification-matrix__label.identification-matrix__label--right Дистанцирован
            span.identification-matrix__axis.identification-matrix__axis--horizontal
            span.identification-matrix__axis.identification-matrix__axis--vertical
            span.identification-matrix__axis-name.identification-matrix__axis-name--relations Ось отношений
            span.identification-matrix__axis-name.identification-matrix__axis-name--goals Ось целей
            span.identification-matrix__point.identification-matrix__point--soulful(title="Душевный")
            span.identification-matrix__point.identification-matrix__point--logic(title="Логик")
            span.identification-matrix__point.identification-matrix__point--persistent(title="Упорный")
            span.identification-matrix__point.identification-matrix__point--activist(title="Деятель")
            span.identification-matrix__point.identification-matrix__point--rebel(title="Бунтарь")
            span.identification-matrix__point.identification-matrix__point--dreamer(title="Мечтатель")
  .columns.is-multiline
    .column.is-half-tablet.is-one-third-fullhd(v-for="item in items" :key="item.name")
      InteractionCard(:item="item")
</template>

<style scoped>
.interaction-guide {
  margin-bottom: 1.25rem;
  padding: 1rem;
  border: 1px solid var(--app-border);
  border-radius: 8px;
  background: var(--app-surface);
  box-shadow: var(--app-shadow);
}

.interaction-guide .columns { margin-bottom: 0; }
.interaction-guide .title { margin-bottom: 0.4rem; }
.interaction-guide > p { margin: 0; color: var(--app-text-muted); }
.interaction-guide__matrix-title { margin: 1rem 0 0.35rem; font-size: 1rem; font-weight: 700; }
.interaction-guide__matrix-copy { margin: 0; color: var(--app-text-muted); line-height: 1.45; }
.interaction-guide__matrix-copy + .interaction-guide__matrix-copy { margin-top: 0.5rem; }
.interaction-guide__matrix { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 0.75rem; margin-top: 0.9rem; }
.interaction-guide__axis { padding: 0.75rem; border-radius: 6px; background: var(--app-surface-muted); }
.interaction-guide__axis strong,
.interaction-guide__axis span { display: block; }
.interaction-guide__axis span { margin-top: 0.2rem; color: var(--app-text-muted); font-size: 0.9rem; }

.identification-matrix { height: 100%; padding: 0.75rem; border: 1px solid var(--app-border); border-radius: 6px; background: var(--app-surface-muted); }
.identification-matrix .title { margin-bottom: 0.5rem; }
.identification-matrix__canvas { position: relative; min-height: 310px; aspect-ratio: 1.22; overflow: hidden; color: #09256a; }
.identification-matrix__label { position: absolute; z-index: 2; font-size: clamp(0.74rem, 1.7vw, 1.05rem); font-weight: 700; white-space: nowrap; }
.identification-matrix__label--top { top: 0; left: 50%; transform: translateX(-50%); }
.identification-matrix__label--bottom { bottom: 0; left: 50%; transform: translateX(-50%); }
.identification-matrix__label--left { top: calc(50% - 2rem); left: 0; }
.identification-matrix__label--right { top: calc(50% - 2rem); right: 0; }
.identification-matrix__axis { position: absolute; z-index: 1; display: block; background: #8a8f98; }
.identification-matrix__axis--horizontal { top: 50%; right: 0.5rem; left: 0.5rem; height: 2px; }
.identification-matrix__axis--horizontal::before,
.identification-matrix__axis--horizontal::after,
.identification-matrix__axis--vertical::before,
.identification-matrix__axis--vertical::after { position: absolute; content: ''; width: 0; height: 0; border-style: solid; }
.identification-matrix__axis--horizontal::before { top: -0.38rem; left: -0.05rem; border-width: 0.4rem 0.65rem 0.4rem 0; border-color: transparent #8a8f98 transparent transparent; }
.identification-matrix__axis--horizontal::after { top: -0.38rem; right: -0.05rem; border-width: 0.4rem 0 0.4rem 0.65rem; border-color: transparent transparent transparent #8a8f98; }
.identification-matrix__axis--vertical { top: 1.8rem; bottom: 1.8rem; left: 50%; width: 2px; }
.identification-matrix__axis--vertical::before { top: -0.05rem; left: -0.38rem; border-width: 0 0.4rem 0.65rem; border-color: transparent transparent #8a8f98; }
.identification-matrix__axis--vertical::after { bottom: -0.05rem; left: -0.38rem; border-width: 0.65rem 0.4rem 0; border-color: #8a8f98 transparent transparent; }
.identification-matrix__axis-name { position: absolute; z-index: 2; color: #09256a; font-size: clamp(0.72rem, 1.45vw, 0.95rem); white-space: nowrap; }
.identification-matrix__axis-name--relations { top: calc(50% + 0.8rem); left: calc(50% + 1rem); }
.identification-matrix__axis-name--goals { top: calc(50% - 0.75rem); left: calc(50% - 1.4rem); transform: rotate(-90deg); transform-origin: left top; }
.identification-matrix__point { position: absolute; z-index: 3; width: clamp(1.8rem, 5vw, 3.2rem); aspect-ratio: 1; border-radius: 50%; box-shadow: 0 0.15rem 0.35rem rgb(0 0 0 / 12%); }
.identification-matrix__point--soulful { top: 25%; left: 27%; background: #efab5b; }
.identification-matrix__point--logic { top: 9%; right: 22%; background: #6b98dd; }
.identification-matrix__point--persistent { top: 20%; right: 29%; background: #9000f5; }
.identification-matrix__point--activist { top: 58%; left: 43%; background: #ff0909; }
.identification-matrix__point--rebel { bottom: 17%; left: 20%; background: #fff000; }
.identification-matrix__point--dreamer { right: 22%; bottom: 9%; background: #bd6400; }

@media screen and (max-width: 560px) {
  .interaction-guide__matrix { grid-template-columns: 1fr; }
}
</style>

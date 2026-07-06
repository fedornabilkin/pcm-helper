<script setup lang="ts">
import {NODE_TYPE_OPTIONS} from "@/networker/entity/graph/nodeType";
import type {NodeTypeOption} from "@/networker/entity/graph/nodeType";

const emit = defineEmits<{
  close: [];
}>()

const getNodeTypeTagStyle = (nodeType: NodeTypeOption): Record<string, string> => {
  return {
    borderColor: nodeType.color,
    backgroundColor: nodeType.color,
    color: '#ffffff',
  }
}
</script>

<template lang="pug">
  .card
    header.card-header
      p.card-header-title Узлы - контакты
      button.card-header-icon(type="button" title="Закрыть" aria-label="Закрыть" @click="emit('close')")
        span.delete
    .card-content
      article.content
        p Добавляйте контакты в сеть в виде узлов графа. Каждый контакт можно отметить цветом, соответствующим фильтру восприятия.
        p Добавляйте в вашу сеть узел при каждом новом знакомстве. Кто знает, возможно это "мост", к важному для вас контакту.
        p Конденсаторы аккумулируют в себе много полезного. Рано или поздно это полезное будет выгодным для вас, поэтому тесная связь не помешает.
        .message
          .message-body Найти коннекторов, которые познакомят с конденсаторами. "Мосты" помогают установить и укрепить отношения с новыми контактами. "Привратник" - ваша помеха.

        .mt-1.tags
          span.tag.node-type-tag(
            v-for="nodeType in NODE_TYPE_OPTIONS"
            :key="nodeType.code"
            :style="getNodeTypeTagStyle(nodeType)"
          )
            span.icon
              svg.node-type-svg-icon(v-if="nodeType.iconKind === 'connector'" viewBox="-10 -10 20 20" aria-hidden="true")
                line(x1="-5" y1="0" x2="5" y2="0")
                circle(cx="-5" cy="0" r="2")
                circle(cx="5" cy="0" r="2")
              svg.node-type-svg-icon(v-else-if="nodeType.iconKind === 'condenser'" viewBox="-10 -10 20 20" aria-hidden="true")
                line(x1="-5" y1="0" x2="-1.5" y2="0")
                line(x1="1.5" y1="0" x2="5" y2="0")
                line(x1="-1.5" y1="-5" x2="-1.5" y2="5")
                line(x1="1.5" y1="-5" x2="1.5" y2="5")
              i.fa(v-else :class="nodeType.iconClass")
            span {{ nodeType.label }}

    footer.card-footer
      .card-footer-item.has-text-black
        svg.footer-condenser-icon(viewBox="-10 -10 20 20" aria-hidden="true")
          line(x1="-5" y1="0" x2="-1.5" y2="0")
          line(x1="1.5" y1="0" x2="5" y2="0")
          line(x1="-1.5" y1="-5" x2="-1.5" y2="5")
          line(x1="1.5" y1="-5" x2="1.5" y2="5")
        span Конденсатор знает больше
</template>

<style scoped>
.node-type-tag {
  background: transparent;
  font-weight: 600;
}

.node-type-tag .icon {
  margin-right: 0.25rem;
}

.node-type-svg-icon,
.footer-condenser-icon {
  width: 1rem;
  height: 1rem;
  fill: none;
  stroke: currentColor;
  stroke-width: 1.7px;
  stroke-linecap: round;
  stroke-linejoin: round;
}

.footer-condenser-icon {
  flex: 0 0 auto;
  margin-right: 0.35rem;
  color: #9d6436;
}
</style>

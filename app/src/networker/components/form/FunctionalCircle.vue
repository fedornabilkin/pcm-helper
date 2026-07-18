<script setup lang="ts">
import {ref, watch} from "vue";
import type {FunctionalCircle as EntityFunctionalCircle} from "@/networker/entity/graph/functionalCircle";
import type {Node as EntityNode} from "@/networker/entity/graph/node";
import type {GraphService} from "@/networker/service/graphService";
import {usePremiumAccess} from '@/core/composable/access/premiumAccess'
import PremiumAccessButton from '@/components/monetisation/PremiumAccessButton.vue'

const props = defineProps<{
  node: EntityNode;
  graphService: GraphService;
}>()

const emit = defineEmits(['change'])
const circles = ref<EntityFunctionalCircle[]>([])
const {isPremium} = usePremiumAccess()

const change = (): void => {
  refreshCircles()
  emit('change')
}

const addCircle = (): void => {
  props.graphService.addFuncCircleToNode(props.node)
  change()
}

const removeCircle = (circle: EntityFunctionalCircle): void => {
  props.graphService.removeFuncCircle(circle.id)
  change()
}

const refreshCircles = (): void => {
  circles.value = props.graphService
    .getNodeFuncCircles(props.node)
    .sort((a: EntityFunctionalCircle, b: EntityFunctionalCircle) => a.r - b.r)
}

const canAddCircle = (): boolean => {
  return props.graphService.canAddFuncCircle(props.node)
}

const getInputValue = (event: Event): string => {
  return (event.target as HTMLInputElement).value
}

const setFillColor = (circle: EntityFunctionalCircle, event: Event): void => {
  if (!isPremium.value) {
    return
  }
  props.graphService.setFuncCircleFill(circle, getInputValue(event))
  change()
}

watch(
  () => props.node?.id,
  () => refreshCircles(),
  {immediate: true},
)
</script>

<template lang="pug">
  .functional-circle-form
    .field
      .control
        button.button.is-small.is-info(
          type="button"
          :disabled="!canAddCircle()"
          @click="addCircle"
        )
          span.icon
            i.fa.fa-circle-plus
          span Добавить круг
      p.help(v-if="!canAddCircle()") Для одной ноды доступно не более трех кругов.

    .box.functional-circle-item(v-for="circle in circles" :key="circle.id")
      .functional-circle-header
        span.tag.is-light {{ props.graphService.getFuncCircleLabel(circle) }}
        button.button.is-small.is-danger.is-light(type="button" title="Удалить круг" @click="removeCircle(circle)")
          span.icon
            i.fa.fa-trash

      .field(v-if="isPremium")
        .control.functional-circle-color
          input.input(
            type="color"
            :value="props.graphService.getFuncCircleColor(circle)"
            @input="setFillColor(circle, $event)"
          )
          input.input(:value="circle.fill" type="text" readonly)
      .functional-circle-premium(v-else)
        span Настройка цвета кругов доступна в Premium.
        PremiumAccessButton
</template>

<style scoped>
.functional-circle-form {
  width: 100%;
}

.functional-circle-item {
  width: 100%;
  margin-bottom: 0.75rem;
  border-radius: 6px;
}

.functional-circle-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.35rem;
  margin-bottom: 0.75rem;
}

.functional-circle-color {
  display: grid;
  grid-template-columns: 3.5rem 1fr;
  gap: 0.5rem;
}

.functional-circle-premium {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.5rem;
  color: var(--app-text-muted);
  font-size: 0.78rem;
}
</style>

<script setup lang="ts">
import {onMounted, ref, watch} from "vue";
import {useRouter} from "vue-router";
import SettingGraph from "@/networker/components/SettingGraph.vue";
import NetworkList from "@/networker/components/NetworkList.vue";
import FunctionalCircleCard from "@/networker/components/FunctionalCircleCard.vue";
import {DrawNetwork} from "@/networker/graph/draw.ts";
import {Node} from "@/networker/entity/graph/node.ts";
import {Link} from "@/networker/entity/graph/link.ts";
import {Network} from "@/networker/entity/graph/network.ts";
import {GraphService} from "@/networker/service/graphService.ts";
import {NetworkService} from "@/networker/service/networkService.ts";
import NodeCard from "@/networker/components/NodeCard.vue";
import LinkCard from "@/networker/components/LinkCard.vue";
import {NodeToolTip} from "@/networker/graph/toolTip.ts";

const router = useRouter()
let networkId = ref(0)
if(router.currentRoute.value.params.id) {
  networkId.value = Number(router.currentRoute.value.params.id)
}
let graphService = new GraphService({storeId: networkId.value});
let networkService = new NetworkService({storeId: networkId.value});

const links = ref(graphService.links);
const funcCircle = ref(graphService.funcCircles);
const networks = ref(networkService.networks);

watch(
    () => router.currentRoute.value.params.id,
    () => {
      networkId.value = Number(router.currentRoute.value.params.id) ?? 0
      graphService = new GraphService({storeId: networkId.value});
      links.value = graphService.links
      funcCircle.value = graphService.funcCircles
      reRender()
    }
)


const currentNetwork = ref<Network | undefined>(networkService.findNetwork(networkId.value));

const isLoading = ref(false)
const isSaved = ref(false)

const graphId = 'nw-graph'
const draw: DrawNetwork = new DrawNetwork({
  dto: graphService.toDTO(),
  box: {w:600,h:600},
  toolTip: new NodeToolTip(),
  clickNode: (e: any, d: Node): void => {
    graphService.setCurrentNode(d)
  },
  cbSimulationEnd: (): void => {saveAll()}
})

onMounted((): void => {
  draw.render(document.getElementById(graphId) as HTMLElement)
})

const reRender = (): void => {
  isLoading.value = true
  draw.dto = graphService.toDTO();
  draw.reRender()
}

const saveAll = (): void => {
  graphService.saveAll()
  isLoading.value = false
  isSaved.value = true

  links.value = graphService.links
  funcCircle.value = graphService.funcCircles

  setTimeout(() => {isSaved.value = false}, 5000)
}

const debounce = graphService.createDebounce()
const change = (): void => {
  debounce(() => {reRender()}, 700)
}

const addNode = (): void => {
  graphService.addNode();
  reRender()
}

const removeNode = (): void => {
  graphService.removeNode(graphService.getCurrentNode());
  reRender();
}

const changeLink = (): void => {
  reRender();
}

const addNetwork = (): void => {
  const network = networkService.addNetwork()
  currentNetwork.value = network
  networkService.saveAll()
  router.push({params: {id: network.id}})
}

const saveNetwork = (): void => {
  networkService.saveAll()
}

const removeNetwork = (network: Network): void => {
  networkService.removeNetwork(network);
  currentNetwork.value = undefined
  networkService.saveAll()
  router.push({params: {id: 0}})
}

const switchNetwork = (item: Network): void => {
  currentNetwork.value = item
  router.push({params: {id: item.id}})
}

const changeFact = (): void => {
  reRender();
}

const importNetwork = (): void => {
  reRender();
}

</script>

<template lang="pug">
.container.mb-4
  network-list(
    :current-network="currentNetwork"
    :networks="networks"
    @saveNetwork="saveNetwork"
    @addNetwork="addNetwork"
    @removeNetwork="removeNetwork"
    @switchNetwork="switchNetwork"
  )

  .columns.is-multiline
    .column.is-half-tablet
      .network-graph(:id="graphId")
      .mt-1
        .saved(v-if="isSaved") Сохранено {{ new Date() }}
    .column.is-half-tablet
      setting-graph.setting-graph(
        :graph-service="graphService"
        :links="links"
        @change="change"
        @addNode="addNode"
        @removeNode="removeNode"
        @changeLink="changeLink"
        @changeFact="changeFact"
        @importNetwork="importNetwork"
      )


  .message
    .message-body Данные вашей сети хранятся в браузере и не синхронизируются. Сеть, построенная на компьютере, не будет отображаться на телефоне или в другом браузере. Изменения сохраняются автоматически.

  .columns.is-multiline
    .column.is-half-tablet.is-one-third-fullhd
      FunctionalCircleCard
    .column.is-half-tablet.is-one-third-fullhd
      NodeCard
    .column.is-half-tablet.is-one-third-fullhd
      LinkCard
</template>

<style>
.graph-container .tooltip {
  display: none;
  position: absolute;
  z-index: 10;
}
</style>
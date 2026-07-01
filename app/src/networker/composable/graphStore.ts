import {useLocalStore} from "../../core/composable/store/localStore";

export function useGraphStore(id: string) {
  const prefix: string = id
  const keyNodes = `${prefix}-graph_nodes`
  const keyLinks = `${prefix}-graph_links`
  const keyFuncCircles = `${prefix}-graph_funcCircles`
  const keyTags = `${prefix}-graph_tags`
  const keyNetworkList = 'network-list'
  const {
    state: nodes, save: saveNodes, clear: clearNodes
  } = useLocalStore(keyNodes, [
    {id:1,name:'Федор Набилкин'},
    {id:2,name:'Алексей Попович'},
    {id:3,name:'Тугарин Змей'},
  ]);

  const {
    state: links, save: saveLinks, clear: clearLinks
  } = useLocalStore(keyLinks, [
    {id:1,source:1,target:2,distance:100},
  ]);

  const {
    state: funcCircles, save: saveFuncCircles, clear: clearFuncCircles
  } = useLocalStore(keyFuncCircles, [
    {id: 1, name:'support', r: 100},
    {id: 2, name:'production', r: 250},
  ]);

  const {
    state: tags, save: saveTags, clear: clearTags
  } = useLocalStore(keyTags, []);

  const {
    state: networks, save: saveNetworks, clear: clearNetworks
  } = useLocalStore(keyNetworkList, []);

  function saveAll(): void {
    saveNodes();
    saveLinks();
    saveFuncCircles();
    saveTags();
    // saveNetworks();
  }

  function clearAll(): void {
    clearNodes();
    clearLinks();
    clearFuncCircles();
    clearTags();
    clearNetworks();
  }

  return {
    nodes,
    links,
    funcCircles,
    tags,
    saveAll,
    clearAll,
    networks,
  };
}

import {useLocalStore} from "../../core/composable/store/localStore";

const getGraphStoreKeys = (id: string | number) => {
  const prefix = String(id)

  return {
    nodes: `${prefix}-graph_nodes`,
    links: `${prefix}-graph_links`,
    funcCircles: `${prefix}-graph_funcCircles`,
    tags: `${prefix}-graph_tags`,
    importRevision: `${prefix}-graph_importRevision`,
    importBackup: `${prefix}-graph_importBackup`,
  }
}

export function clearGraphStore(id: string | number): void {
  Object.values(getGraphStoreKeys(id)).forEach((key: string): void => {
    localStorage.removeItem(key)
  })
}

export function useGraphStore(id: string | number) {
  const keys = getGraphStoreKeys(id)
  const {
    state: nodes, save: saveNodes, clear: clearNodes
  } = useLocalStore(keys.nodes, [
    {id:1,name:'Федор Набилкин'},
    {id:2,name:'Алексей Попович'},
    {id:3,name:'Тугарин Змей'},
  ]);

  const {
    state: links, save: saveLinks, clear: clearLinks
  } = useLocalStore(keys.links, [
    {id:1,source:1,target:2,distance:100},
  ]);

  const {
    state: funcCircles, save: saveFuncCircles, clear: clearFuncCircles
  } = useLocalStore(keys.funcCircles, [
    {id: 1, nodeId: 1, name:'support', r: 100, fill: 'rgba(71,157,248,0.26)', stroke: 'rgba(71,157,248,0.55)'},
    {id: 2, nodeId: 1, name:'production', r: 250, fill: 'rgba(71,157,248,0.16)', stroke: 'rgba(71,157,248,0.38)'},
    {id: 3, nodeId: 1, name:'development', r: 400, fill: 'rgba(71,157,248,0.08)', stroke: 'rgba(71,157,248,0.24)'},
  ]);

  const {
    state: tags, save: saveTags, clear: clearTags
  } = useLocalStore(keys.tags, []);

  function saveAll(): void {
    saveNodes();
    saveLinks();
    saveFuncCircles();
    saveTags();
  }

  function clearAll(): void {
    clearNodes();
    clearLinks();
    clearFuncCircles();
    clearTags();
    localStorage.removeItem(keys.importRevision)
    localStorage.removeItem(keys.importBackup)
  }

  return {
    nodes,
    links,
    funcCircles,
    tags,
    saveAll,
    clearAll,
  };
}

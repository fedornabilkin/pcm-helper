import {useLocalStore} from "../../core/composable/store/localStore.ts";

export function useNetworkStore() {
  const keyNetworkList = 'network-list'

  const {
    state: networks, save: saveNetworks, clear: clearNetworks
  } = useLocalStore(keyNetworkList, []);

  function saveAll(): void {
    saveNetworks();
  }

  function clearAll(): void {
    clearNetworks();
  }

  return {
    saveAll,
    clearAll,
    networks,
  };
}

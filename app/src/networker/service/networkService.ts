import {NetworkBuilder} from "../entity/graph/builder";
import {Network} from "../entity/graph/network";
import {useNetworkStore} from "../composable/networkStore";
import {MainService} from "./mainService";
import {clearGraphStore} from "../composable/graphStore";
import {checkLimitAccess, type AccessGuardResult} from '@/core/composable/access/premiumAccess';

const DEFAULT_NETWORK_COUNT = 1

export class NetworkService extends MainService{
  private storeId: number = 0
  private networkBuilder: NetworkBuilder;
  private networkStore: any;

  networks: Network[] = [];

  constructor(config: any = {}) {
    super()
    Object.assign(this, config)

    this.networkBuilder = new NetworkBuilder();

    this.networkStore = useNetworkStore(this.name);

    this.networks = this.networkBuilder.createCollection(this.networkStore.networks.value);
  }

  canAddNetwork(): boolean {
    return this.getNetworkCreationAccess().success
  }

  getNetworkCreationAccess(): AccessGuardResult {
    return checkLimitAccess('networks', this.networks.length + DEFAULT_NETWORK_COUNT)
  }

  addNetwork(name?: string): Network | undefined {
    if (!this.canAddNetwork()) {
      return undefined
    }

    const networkName = name?.trim() || `Сеть ${this.networks.length + DEFAULT_NETWORK_COUNT + 1}`
    this.networkBuilder.build({id: this.nextId(this.networks), name: networkName})
    const network = this.networkBuilder.getEntity()
    this.networks.push(network)
    return network
  }

  removeNetwork(network: Network): void {
    const index = this.networks.findIndex(n => n.id === network.id);
    if (index === -1) {
      return
    }

    clearGraphStore(network.id)
    this.networks.splice(index, 1);
  }

  findNetwork(id: number): Network|undefined {
    const index = this.networks.findIndex(n => n.id === id);
    if (index !== -1) return this.networks[index]
    return undefined
  }

  saveAll(): void {
    this.networkStore.networks.value = this.networks;
    this.networkStore.saveAll();
  }
}

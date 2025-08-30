import {NetworkBuilder} from "../entity/graph/builder";
import {Network} from "../entity/graph/network.ts";
import {useNetworkStore} from "../composable/networkStore.ts";
import {MainService} from "./mainService.ts";

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

  addNetwork(name: string = 'Сетка'): Network {
    this.networkBuilder.build({id: this.nextId(this.networks), name})
    const network = this.networkBuilder.getEntity()
    this.networks.push(network)
    console.log('ans')
    return network
  }

  removeNetwork(network: Network): void {
    const index = this.networks.findIndex(n => n.id === network.id);
    if (index !== -1) this.networks.splice(index, 1);
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

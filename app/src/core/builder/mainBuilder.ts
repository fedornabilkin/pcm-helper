import MainEntity from './mainEntity.ts';

export default class MainBuilder {
  entity: MainEntity = new MainEntity()
  collection: MainEntity[] = []
  data: any;

  constructor(config = {}) {
    Object.assign(this, config)
    this.reset()
  }

  createEntity(): MainEntity {
    return new MainEntity()
  }

  reset(): void {
    this.entity = this.createEntity()
  }

  getEntity(): MainEntity {
    const result: MainEntity = this.entity
    this.reset()
    return result
  }

  build(data: any) {
    this.data = data
  }

  baseBuild(builder: MainBuilder, data: any) {
    builder.build(data)
    return builder.getEntity()
  }

  createCollection(data: any) {
    this.collection = []
    for (let item in data) {
      this.build(data[item])
      this.collection.push(this.getEntity())
    }

    return this.getCollection()
  }

  getCollection(): MainEntity[] {
    const collection: MainEntity[] = this.collection
    this.collection = []
    return collection
  }
}
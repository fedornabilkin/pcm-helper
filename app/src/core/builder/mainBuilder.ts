import MainEntity from './mainEntity';

export default class MainBuilder<TEntity extends MainEntity = MainEntity, TData = unknown> {
  entity!: TEntity
  collection: TEntity[] = []
  data?: TData;

  constructor(config = {}) {
    Object.assign(this, config)
    this.reset()
  }

  createEntity(): TEntity {
    return new MainEntity() as TEntity
  }

  reset(): void {
    this.entity = this.createEntity()
  }

  getEntity(): TEntity {
    const result = this.entity
    this.reset()
    return result
  }

  build(data: TData): void {
    this.data = data
  }

  baseBuild<TChildEntity extends MainEntity, TChildData>(
    builder: MainBuilder<TChildEntity, TChildData>,
    data: TChildData,
  ): TChildEntity {
    builder.build(data)
    return builder.getEntity()
  }

  createCollection(data: TData[] = []): TEntity[] {
    this.collection = []
    for (const item of data) {
      this.build(item)
      this.collection.push(this.getEntity())
    }

    return this.getCollection()
  }

  getCollection(): TEntity[] {
    const collection = this.collection
    this.collection = []
    return collection
  }
}

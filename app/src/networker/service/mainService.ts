export class MainService {

  resetIds<T extends {id?: number}>(items: T[]): void {
    items.forEach((item: T) => {
      if(!item.id) {
        item.id = this.nextId(items)
      }
    })
  }

  nextId<T extends {id?: number}>(items: T[]): number {
    if (items.length < 1) return 1
    const ids: number[] = items.map((item: T) => item.id ?? 0)
    const max: number = Math.max(...ids)
    return max+1
  }

  createDebounce(): (callback: () => void, delay: number) => void {
    let timeout: number|undefined = undefined
    return function (callback: () => void, delay: number) {
      clearTimeout(timeout)
      timeout = setTimeout(() => {
        callback()
      }, delay || 500)
    }
  }
}

export class MainService {

  resetIds(items: []): void {
    items.map((i: any) => {
      if(!i.id) {
        i.id = this.nextId(items)
      }
    })
  }

  nextId(items: []): number {
    if (items.length < 1) return 1
    const ids: number[] = items.map((i: any) => i.id ?? 0)
    const max: number = Math.max(...ids)
    return max+1
  }

  createDebounce() {
    let timeout: number|undefined = undefined
    return function (callback: any, delay: number) {
      clearTimeout(timeout)
      timeout = setTimeout(() => {
        callback()
      }, delay || 500)
    }
  }
}
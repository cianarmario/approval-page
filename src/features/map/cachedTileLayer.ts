import * as L from 'leaflet'

/** Reuse decoded, unloaded tiles on return visits; HTTP caching handles evicted entries. */
export class CachedTileLayer extends L.TileLayer {
  private saved = new Map<string, HTMLImageElement>()
  private urls = new WeakMap<HTMLImageElement, string>()
  private pixels = 0

  constructor(url: string, options: L.TileLayerOptions) {
    super(url, { updateWhenIdle: true, updateWhenZooming: false, keepBuffer: 2, noWrap: true, ...options })
    this.on('tileunload', (event: L.TileEvent) => {
      const tile = event.tile as HTMLImageElement
      // Cancelling a pending request replaces it with Leaflet's cached blank
      // GIF, which can already be complete when tileunload fires.
      if (!tile.complete || !tile.naturalWidth || tile.src === L.Util.emptyImageUrl) return
      const key = this.urls.get(tile)
      if (!key) return
      const previous = this.saved.get(key)
      if (previous) this.pixels -= previous.naturalWidth * previous.naturalHeight
      this.saved.delete(key); this.saved.set(key, tile)
      this.pixels += tile.naturalWidth * tile.naturalHeight
      // At most 8 MiB of decoded pixels per style, including retina imagery.
      while (this.saved.size > 32 || this.pixels > 2 * 1024 * 1024) {
        const oldest = this.saved.keys().next().value!
        const image = this.saved.get(oldest)!
        this.pixels -= image.naturalWidth * image.naturalHeight
        this.saved.delete(oldest)
      }
    })
  }

  createTile(coords: L.Coords, done: L.DoneCallback) {
    const key = this.getTileUrl(coords), tile = this.saved.get(key)
    if (!tile) {
      const created = super.createTile(coords, done) as HTMLImageElement
      this.urls.set(created, key)
      return created
    }
    this.saved.delete(key); this.pixels -= tile.naturalWidth * tile.naturalHeight
    // GridLayer registers the returned tile before its ready callback runs.
    void Promise.resolve().then(() => done(undefined, tile))
    return tile
  }

  _removeTile(key: string) {
    // TileLayer normally replaces src with an empty image before tileunload.
    // Preserve only fully decoded tiles; retain its normal cancellation of
    // unfinished requests and GridLayer's normal removal/events bookkeeping.
    const tile = (this as unknown as { _tiles: Record<string, { el: HTMLImageElement }> })._tiles[key]?.el
    const parent = tile?.complete && tile.naturalWidth ? L.GridLayer.prototype : L.TileLayer.prototype
    const remover = parent as unknown as { _removeTile(key: string): void }
    remover._removeTile.call(this, key)
  }
}

export const cachedTileLayer = (url: string, options: L.TileLayerOptions) => new CachedTileLayer(url, options)

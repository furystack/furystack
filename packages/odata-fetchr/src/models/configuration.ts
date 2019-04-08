/**
 * Model for configuring custom fetch behavior
 */
export interface Configuration {
  getMetadata: () => string
  writeCollectionService: (collection: any) => Promise<void>
}

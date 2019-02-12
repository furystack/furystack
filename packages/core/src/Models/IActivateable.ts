/**
 * Defines that an entry has an async activate() method
 */
export interface IActivateable {
  activate: () => Promise<void>
}

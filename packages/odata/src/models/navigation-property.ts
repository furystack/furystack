import { DefaultFilter } from '@furystack/core'
import { Constructable, Injector } from '@furystack/inject'
import { DataSet } from '@furystack/repository'

/**
 * Model that defines a navigation property that returns a
 */
export class NavigationProperty<T, TRelated> {
  public propertyName!: string
  public model!: Constructable<T>
  public relatedModel!: Constructable<TRelated>
  public dataSet!: string
  public getRelatedEntity!: (
    entity: T,
    dataSet: DataSet<TRelated, DefaultFilter<TRelated>>,
    injector: Injector,
    filter: DefaultFilter<TRelated>,
  ) => Promise<TRelated>
}

/**
 * Model that defines a navigation property that returns a collection
 */
// tslint:disable-next-line: max-classes-per-file
export class NavigationPropertyCollection<T, TRelated> {
  public propertyName!: string
  public model!: Constructable<T>
  public relatedModel!: Constructable<TRelated>
  public dataSet!: string
  public getRelatedEntities!: (
    entity: T,
    dataSet: DataSet<TRelated, DefaultFilter<TRelated>>,
    injector: Injector,
    filter: DefaultFilter<TRelated>,
  ) => Promise<TRelated[]>
}

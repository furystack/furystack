import { ObservableValue } from '@furystack/utils'
import type { ListServiceOptions } from './list-service.js'
import { ListService } from './list-service.js'

export type TreeServiceOptions<T> = ListServiceOptions<T> & {
  /**
   * Returns the children of a given node
   * @param item The parent node
   * @returns The child nodes, or an empty array if the node has no children
   */
  getChildren: (item: T) => T[]
}

export type FlattenedTreeNode<T> = {
  item: T
  level: number
  hasChildren: boolean
  isExpanded: boolean
}

/**
 * Service for managing tree state including expand/collapse, hierarchy navigation,
 * and flattening the tree into a visible items list for rendering
 */
export class TreeService<T> extends ListService<T> {
  public expandedNodes = new ObservableValue<Set<T>>(new Set())

  public rootItems = new ObservableValue<T[]>([])

  public flattenedNodes = new ObservableValue<Array<FlattenedTreeNode<T>>>([])

  public override [Symbol.dispose]() {
    super[Symbol.dispose]()
    this.expandedNodes[Symbol.dispose]()
    this.rootItems[Symbol.dispose]()
    this.flattenedNodes[Symbol.dispose]()
  }

  /**
   * Checks whether a node is currently expanded
   */
  public isExpanded = (item: T) => this.expandedNodes.getValue().has(item)

  /**
   * Expands a node, making its children visible
   */
  public expand = (item: T) => {
    const expanded = new Set(this.expandedNodes.getValue())
    expanded.add(item)
    this.expandedNodes.setValue(expanded)
    this.updateFlattenedNodes()
  }

  /**
   * Collapses a node, hiding its children
   */
  public collapse = (item: T) => {
    const expanded = new Set(this.expandedNodes.getValue())
    expanded.delete(item)
    this.expandedNodes.setValue(expanded)
    this.updateFlattenedNodes()
  }

  /**
   * Toggles the expanded state of a node
   */
  public toggleExpanded = (item: T) => {
    if (this.isExpanded(item)) {
      this.collapse(item)
    } else {
      const children = this.treeOptions.getChildren(item)
      if (children.length > 0) {
        this.expand(item)
      }
    }
  }

  /**
   * Finds the parent of a given item in the tree
   */
  public getParent(item: T): T | undefined {
    const findParent = (nodes: T[]): T | undefined => {
      for (const node of nodes) {
        const children = this.treeOptions.getChildren(node)
        if (children.includes(item)) {
          return node
        }
        const found = findParent(children)
        if (found) return found
      }
      return undefined
    }
    return findParent(this.rootItems.getValue())
  }

  /**
   * Flattens the tree based on which nodes are expanded, and syncs the result
   * to both flattenedNodes and the inherited ListService items
   */
  public updateFlattenedNodes() {
    const expanded = this.expandedNodes.getValue()
    const result: Array<FlattenedTreeNode<T>> = []

    const flatten = (nodes: T[], level: number) => {
      for (const node of nodes) {
        const children = this.treeOptions.getChildren(node)
        const hasChildren = children.length > 0
        const isExpanded = expanded.has(node)

        result.push({ item: node, level, hasChildren, isExpanded })

        if (hasChildren && isExpanded) {
          flatten(children, level + 1)
        }
      }
    }

    flatten(this.rootItems.getValue(), 0)
    this.flattenedNodes.setValue(result)
    this.items.setValue(result.map((n) => n.item))
  }

  /**
   * Gets the FlattenedTreeNode for a given item
   */
  public getNodeInfo(item: T): FlattenedTreeNode<T> | undefined {
    return this.flattenedNodes.getValue().find((n) => n.item === item)
  }

  public override handleKeyDown(ev: KeyboardEvent) {
    const hasFocus = this.hasFocus.getValue()
    const focusedItem = this.focusedItem.getValue()

    if (hasFocus && focusedItem) {
      switch (ev.key) {
        case 'ArrowRight': {
          ev.preventDefault()
          const children = this.treeOptions.getChildren(focusedItem)
          if (children.length > 0) {
            if (this.isExpanded(focusedItem)) {
              this.focusedItem.setValue(children[0])
            } else {
              this.expand(focusedItem)
            }
          }
          return
        }
        case 'ArrowLeft': {
          ev.preventDefault()
          if (this.isExpanded(focusedItem)) {
            this.collapse(focusedItem)
          } else {
            const parent = this.getParent(focusedItem)
            if (parent) {
              this.focusedItem.setValue(parent)
            }
          }
          return
        }
        default: {
          break
        }
      }
    }

    super.handleKeyDown(ev)
  }

  public override handleItemDoubleClick(item: T) {
    const children = this.treeOptions.getChildren(item)
    if (children.length > 0) {
      this.toggleExpanded(item)
    }
  }

  constructor(private treeOptions: TreeServiceOptions<T>) {
    super(treeOptions)
  }
}

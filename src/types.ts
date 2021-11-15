export interface GraphOptions {
  label?: string
}

export interface Edge {
  v: string
  w: string
}

export type Node<T> = T | undefined
export type Nodes<T> = Map<string, Node<T>>
export type InEdges = Map<string, Map<string, Edge>>
export type OutEdges = Map<string, Map<string, Edge>>
export type Predecessors = Map<string, Map<string, number>>
export type Successors = Map<string, Map<string, number>>
export type Edges = Map<string, Edge>
export type EdgeLabel<U> = U | undefined
export type EdgeLabels<U> = Map<string, EdgeLabel<U>>

export interface GraphOptions {
  label?: string
}

export interface Edge {
  v: string
  w: string
}

export type Nodes<T> = Map<string, T>
export type InEdges = Map<string, Map<string, Edge>>
export type OutEdges = Map<string, Map<string, Edge>>
export type Predecessors = Map<string, Map<string, number>>
export type Successors = Map<string, Map<string, number>>
export type Edges = Map<string, Edge>
export type EdgeLabels<U> = Map<string, U>

export type OptionalNodeValue<T> = T extends undefined ? [v: string] : [v: string, value: T]
export type OptionalEdgeValue<U> = U extends undefined ? [v: string, w: string] : [v: string, w: string,  value: U]

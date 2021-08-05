export interface IGraphOptions {
  label?: string
}

export interface IEdge {
  v: string
  w: string
}

export type Nodes = Map<string, unknown>
export type InEdges = Map<string, Map<string, IEdge>>
export type OutEdges = Map<string, Map<string, IEdge>>
export type Predecessors = Map<string, Map<string, number>>
export type Successors = Map<string, Map<string, number>>
export type Edges = Map<string, IEdge>
export type EdgeLabels = Map<string, unknown>

import { IEdge, IGraphOptions } from './types'
import { isEmptyMap } from './util'

const EDGE_KEY_DELIM = '\x01'

type Nodes = Map<string, unknown>
type InEdges = Map<string, Map<string, IEdge>>
type OutEdges = Map<string, Map<string, IEdge>>
type Predecessors = Map<string, Map<string, number>>
type Successors = Map<string, Map<string, number>>
type Edges = Map<string, IEdge>
type EdgeLabels = Map<string, unknown>

class Graph {
  private _label?: string
  private _nodes: Nodes
  private _in: InEdges
  private _out: OutEdges
  private _predecessors: Predecessors
  private _successors: Successors
  private _edges: Edges
  private _edgeLabels: EdgeLabels
  private _nodeCount: number
  private _edgeCount: number

  constructor (options: IGraphOptions = {}) {
    this._label = options.label

    // v -> label
    this._nodes = new Map()

    // v -> edgeObj
    this._in = new Map()

    // v -> edgeObj
    this._out = new Map()

    // u -> v -> Number
    this._predecessors = new Map()

    // v -> w -> Number
    this._successors = new Map()

    // e -> edgeObj
    this._edges = new Map()

    // e -> label
    this._edgeLabels = new Map()

    this._nodeCount = 0
    this._edgeCount = 0
  }

  /**
   * Returns the currently assigned label for the graph.
   */
  label (): string | undefined {
    return this._label
  }

  /**
   * Returns the number of nodes in the graph.
   * Takes O(1) time.
   */
  nodeCount () {
    return this._nodeCount
  }

  /**
   * Returns the number of edges in the graph.
   * Takes O(1) time.
   */
  edgeCount () {
    return this._edgeCount
  }

  /**
   * Returns the value assigned to the node with the id v if it is in the graph.
   * Otherwise returns undefined.
   * Takes O(1) time.
   */
  node (v: string): unknown {
    return this._nodes.get(v)
  }

  /**
   *
   * Creates or updates the value for the node v in the graph.
   * If value is supplied it is set as the value for the node.
   * Takes O(1) time.
   */
  setNode <T>(v: string, value?: T): Graph {
    // if node already exists, just set value
    if (this._nodes.has(v)) {
      this._nodes.set(v, value ?? null)
      return this
    }

    this._nodes.set(v, value ?? null)
    this._in.set(v, new Map())
    this._predecessors.set(v, new Map())
    this._out.set(v, new Map())
    this._successors.set(v, new Map())

    ++this._nodeCount

    return this
  }

  /**
   * Returns true if the graph has a node with the id v.
   * Takes O(1) time.
   */
  hasNode (v: string): boolean {
    return this._nodes.has(v)
  }

  /**
   * Remove the node with the id v in the graph or do nothing if the node is not in the graph.
   * If the node was removed this function also removes any incident edges.
   * Takes O(|E|) time.
   */
  removeNode (v: string): Graph {
    if (!this._nodes.has(v)) {
      return this
    }

    this._nodes.delete(v)
    for (const key of this._in.get(v)?.keys() ?? []) {
      const edge = this._edges.get(key)
      if (edge) {
        this.removeEdge(edge.v, edge.w)
      }
    }
    this._in.delete(v)
    this._predecessors.delete(v)
    for (const key of this._out.get(v)?.keys() ?? []) {
      const edge = this._edges.get(key)
      if (edge) {
        this.removeEdge(edge.v, edge.w)
      }
    }
    this._out.delete(v)
    this._successors.delete(v)
    --this._nodeCount

    return this
  }

  /**
   * Removes the edge (v, w) if the graph has an edge between v and w, if not this function does nothing.
   * v and w can be interchanged for undirected graphs.
   * Takes O(1) time.
   */
  removeEdge (v: string, w: string): Graph {
    const e = edgeArgsToId(v, w)

    const edge = this._edges.get(e)
    if (!edge) {
      return this
    }

    this._edgeLabels.delete(e)
    this._edges.delete(e)

    const predecessors = this._predecessors.get(w)
    if (predecessors) {
      decrementOrRemoveEntry(predecessors, v)
    }

    const successors = this._successors.get(v)
    if (successors) {
      decrementOrRemoveEntry(successors, w)
    }

    this._in.get(w)?.delete(e)
    this._out.get(w)?.delete(e)
    this._edgeCount--

    return this
  }

  /**
   * Returns the ids of the nodes in the graph.
   * Use node(v) to get the label for each node.
   * Takes O(|V|) time.
   */
  nodes (): string[] {
    return Array.from(this._nodes.keys())
  }

  /**
   * Returns the edgeObj for each edge in the graph.
   * Takes O(|E|) time.
   */
  edges (): IEdge[] {
    return Array.from(this._edges.values())
  }

  /**
   * Returns the value for the edge (v, w) if the graph has an edge between v and w.
   * Returnes undefined if there is no such edge in the graph.
   * v and w can be interchanged for undirected graphs.
   * Takes O(1) time.
   */
  edge (v: string, w: string): unknown {
    const e = edgeArgsToId(v, w)
    return this._edgeLabels.get(e)
  }

  /**
   * Returns true if the graph has an edge between v and w with the optional name.
   * v and w can be interchanged for undirected graphs.
   * Takes O(1) time.
   */
  hasEdge (v: string, w: string): boolean {
    const e = edgeArgsToId(v, w)
    return this._edgeLabels.has(e)
  }

  /**
   * Creates or updates the value for the edge (v, w).
   * If value is supplied it is set as the value for the edge.
   * Takes O(1) time.
   */
  setEdge <T>(v: string, w: string, value?: T): Graph {
    const e = edgeArgsToId(v, w)

    // if edge already exists, just set value
    if (this._edgeLabels.has(e)) {
      this._edgeLabels.set(e, value ?? null)
      return this
    }

    this.setNode(v)
    this.setNode(w)
    this._edgeLabels.set(e, value ?? null)

    const edgeObj = { v, w }
    this._edges.set(e, { v, w })

    const predecessors = this._predecessors.get(w)
    if (predecessors) {
      incrementOrInitEntry(predecessors, v)
    }

    const successors = this._successors.get(v)
    if (successors) {
      incrementOrInitEntry(successors, w)
    }

    this._in.get(w)?.set(e, edgeObj)
    this._out.get(v)?.set(e, edgeObj)
    this._edgeCount++

    return this
  }

  /**
   * Returns those nodes in the graph that have no in-edges.
   * Takes O(|V|) time.
   */
  sources (): string[] {
    return this.nodes().filter(node => {
      const incoming = this._in.get(node)
      return isEmptyMap(incoming)
    })
  }

  /**
   * Returns those nodes in the graph that have no out-edges.
   * Takes O(|V|) time.
   */
  sinks (): string[] {
    return this.nodes().filter(node => {
      const incoming = this._out.get(node)
      return isEmptyMap(incoming)
    })
  }

  /**
   * Return all nodes that are predecessors of the specified node or undefined if node v is not in the graph.
   * Behavior is undefined for undirected graphs - use neighbors instead.
   * Takes O(|V|) time.
   */
  predecessors (v: string): string[] | undefined {
    const nodes = this._predecessors.get(v)
    return nodes ? Array.from(nodes.keys()) : undefined
  }

  /**
   * Return all nodes that are successors of the specified node or undefined if node v is not in the graph.
   * Behavior is undefined for undirected graphs - use neighbors instead.
   * Takes O(|V|) time.
   */
  successors (v: string): string[] | undefined {
    const nodes = this._successors.get(v)
    return nodes ? Array.from(nodes.keys()) : undefined
  }

  /**
   * Return all nodes that are predecessors or successors of the specified node or undefined if node v is not in the graph.
   * Takes O(|V|) time.
   */
  neighbors (v: string): string[] | undefined {
    const preds = this.predecessors(v)
    if (preds) {
      const succs = this.successors(v)
      return union(preds ?? [], succs ?? [])
    }

    return
  }

   /**
   * Returns true if v is the leaf node. Finds successors for directed graphs and neightbors for undirected graphs.
   * Takes O(|V|) time.
   */
  isLeaf (v: string): boolean {
    const neigbours = this.successors(v)
    return neigbours?.length === 0
  }

  /**
   * Return all edges that point to the node v.
   * Optionally filters those edges down to just those coming from node w.
   * Returns undefined if node v is not in the graph.
   * Takes O(|E|) time.
   */
  inEdges (v: string, w?: string): IEdge[] | undefined {
    const inEdges = this._in.get(v)
    if (!inEdges) {
      return
    }

    const edges = Array.from(inEdges.values())
    return edges.filter(edge => w != null ? edge.v === w : true)
  }

    /**
     * Return all edges that are pointed at by node v.
     * Optionally filters those edges down to just those point to w.
     * Returns undefined if node v is not in the graph.
     * Takes O(|E|) time.
     */
     outEdges (v: string, w?: string): IEdge[] | undefined {
      const outEdges = this._out.get(v)
      if (!outEdges) {
        return
      }

      const edges = Array.from(outEdges.values())
      return edges.filter(edge => w != null ? edge.w === w : true)
    }

    /**
     * Returns all edges to or from node v regardless of direction.
     * Optionally filters those edges down to just those between nodes v and w regardless of direction.
     * Returns undefined if node v is not in the graph.
     * Takes O(|E|) time.
     */
    nodeEdges (v: string, w?: string): IEdge[] | undefined {
      const inEdges = this.inEdges(v, w)
      if (!inEdges) {
        return
      }

      const outEdges = this.outEdges(v, w) ?? []

      return [
        ...inEdges,
        ...outEdges
      ]
    }
}

function edgeArgsToId (v: string, w: string): string {
  return v + EDGE_KEY_DELIM + w + EDGE_KEY_DELIM
}

// return single unique array of strings
function union (a: string[], b: string []) {
  const merged = [...a, ...b]
  return [...new Set(merged)]
}

function incrementOrInitEntry(map: Map<string, number>, k: string): void {
  const count = map.get(k)

  if (count) {
    map.set(k, count + 1)
  } else {
    map.set(k, 1)
  }
}

function decrementOrRemoveEntry(map: Map<string, number>, k: string): void {
  const count = map.get(k) ?? 1
  const newCount = count - 1

  if (newCount === 0) {
    map.delete(k)
  }
}

export default Graph

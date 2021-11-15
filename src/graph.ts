import { Edge, GraphOptions, Nodes, InEdges, EdgeLabels, Edges, OutEdges, Predecessors, Successors } from './types'
import { isEmptyMap } from './util'

const EDGE_KEY_DELIM = '\x01'

type OptionalNodeValue<T> = T extends undefined ? [v: string] : [v: string, value: T]
type OptionalEdgeValue<U> = U extends undefined ? [v: string, w: string] : [v: string, w: string,  value: U]

class Graph<T extends any = undefined, U extends any = undefined> {
  private _label?: string
  private _nodes: Nodes<T>
  private _in: InEdges
  private _out: OutEdges
  private _predecessors: Predecessors
  private _successors: Successors
  private _edges: Edges
  private _edgeLabels: EdgeLabels<U | undefined>
  private _nodeCount: number
  private _edgeCount: number

  constructor (options: GraphOptions = {}) {
    this._label = options.label

    // v -> label
    this._nodes = new Map<string, T>()

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
  node (v: string): T | undefined {
    return this._nodes.get(v)
  }

  /**
   *
   * Creates or updates the value for the node v in the graph.
   * If value is supplied it is set as the value for the node.
   * Takes O(1) time.
   */
  setNode (...params: OptionalNodeValue<T>): Graph<T, U> {
    const v = params[0]
    const value = params[1] as T

    // if node already exists, just set value
    if (this._nodes.has(v)) {
      this._nodes.set(v, value)
      return this
    }

    this._nodes.set(v, value)
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
  removeNode (v: string): Graph<T, U> {
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
  removeEdge (v: string, w: string): Graph<T, U> {
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
  nodes (): Nodes<T> {
    return this._nodes
  }

  /**
   * Returns the edgeObj for each edge in the graph.
   * Takes O(|E|) time.
   */
  edges (): Edge[] {
    return Array.from(this._edges.values())
  }

  /**
   * Returns the value for the edge (v, w) if the graph has an edge between v and w.
   * Returnes undefined if there is no such edge in the graph.
   * v and w can be interchanged for undirected graphs.
   * Takes O(1) time.
   */
  edge (v: string, w: string): U | undefined {
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
  setEdge (...params: OptionalEdgeValue<U>): Graph<T, U> {
    const v = params[0]
    const w = params[1]
    const value = params[2] as U

    const e = edgeArgsToId(v, w)

    // if edge already exists, just set value
    if (this._edgeLabels.has(e)) {
      this._edgeLabels.set(e, value)
      return this
    }

    // if node already exists
    if (!this._nodes.has(v)) {
      throw new Error(`no such node ${v}`)
    }

    if (!this._nodes.has(w)) {
      throw new Error(`no such node ${w}`)
    }

    this._edgeLabels.set(e, value)

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
  sources (): Nodes<T | undefined> {
    const nodes = Array.from(this.nodes())

    const sources = nodes.filter(([id]) => {
      const incoming = this._out.get(id)
      return isEmptyMap(incoming)
    })

    return new Map(sources)
  }

  /**
   * Returns those nodes in the graph that have no out-edges.
   * Takes O(|V|) time.
   */
  sinks (): Nodes<T | undefined> {
    const nodes = Array.from(this.nodes())

    const sinks = nodes.filter(([id]) => {
      const incoming = this._out.get(id)
      return isEmptyMap(incoming)
    })

    return new Map(sinks)
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
  inEdges (v: string, w?: string): Edge[] | undefined {
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
     outEdges (v: string, w?: string): Edge[] | undefined {
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
    nodeEdges (v: string, w?: string): Edge[] | undefined {
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

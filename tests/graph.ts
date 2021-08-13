import { suite } from 'uvu'
import expect from 'expect'

import Graph from '../src/graph'

interface Context {
  graph: Graph
}

function newGraph (ctx: Context) {
  ctx.graph = new Graph()
}

const initialState = suite<Context>('initialState')
initialState.before.each(newGraph)

initialState('has no nodes', ({ graph }) => {
  expect(graph.nodeCount()).toEqual(0)
})

initialState('has no edges', ({ graph }) => {
  expect(graph.edgeCount()).toEqual(0)
})

initialState('has no label', ({ graph }) => {
  expect(graph.label()).toBe(undefined)
})

initialState('can set a label', () => {
  const graph = new Graph({ label: 'foo' })
  expect(graph.label()).toBe('foo')
})

initialState.run()

// ---

const nodes = suite<Context>('nodes')
nodes.before.each(newGraph)

nodes('is empty if there are no nodes in the graph', ({ graph }) => {
  expect(graph.nodes()).toEqual([])
})

nodes('returns the ids of nodes in the graph', ({ graph }) => {
  graph.setNode('a')
  graph.setNode('b')
  expect(graph.nodes()).toEqual(['a', 'b'])
})

nodes.run()

// ---

const sources = suite<Context>('sources')
sources.before.each(newGraph)

sources('returns nodes in the graph that have no in-edges', ({ graph }) => {
  graph.setNode('a')
  graph.setNode('b')

  graph.setNode('c')
  graph.setNode('d')
  graph.setEdge('c', 'd')

  expect(graph.sources()).toEqual(['a', 'b', 'c'])
})

sources.run()

// ---

const sinks = suite<Context>('sinks')
sinks.before.each(newGraph)

sinks('returns nodes in the graph that have no out-edges', ({ graph }) => {
  graph.setNode('a')
  graph.setNode('b')

  graph.setNode('c')
  graph.setNode('d')
  graph.setEdge('c', 'd')

  expect(graph.sinks()).toEqual(['a', 'b', 'd'])
})

sinks.run()

// ---

const setNode = suite<Context>('setNode')
setNode.before.each(newGraph)

setNode('creates the node if it is not part of the graph', ({ graph }) => {
  graph.setNode('a')
  expect(graph.hasNode('a')).toBe(true)
  expect(graph.node('a')).toBe(null)
  expect(graph.nodeCount()).toBe(1)
})

setNode('can set a value for the node', ({ graph }) => {
  graph.setNode('a', 'foo')
  expect(graph.node('a')).toEqual('foo')
})

setNode('is idempotent', ({ graph }) => {
  graph.setNode('a', 'foo')
  graph.setNode('a', 'foo')
  expect(graph.node('a')).toEqual('foo')
  expect(graph.nodeCount()).toBe(1)
})

setNode('is chainable', ({ graph }) => {
  expect(graph.setNode('a')).toEqual(graph)
})

setNode.run()

// ---

const node = suite<Context>('node')
node.before.each(newGraph)

node('returns undefined if the node is not part of the graph', ({ graph }) => {
  expect(graph.node('a')).toBe(undefined)
})

node('returns the value of the node if it is part of the graph', ({ graph }) => {
  graph.setNode('a', 'foo')
  expect(graph.node('a')).toEqual('foo')
})

node.run()

// ---

const removeNode = suite<Context>('removeNode')
removeNode.before.each(newGraph)

removeNode('does nothing if the node is not in the graph', ({ graph }) => {
  expect(graph.nodeCount()).toEqual(0)
  graph.removeNode('a')
  expect(graph.hasNode('a')).toBe(false)
  expect(graph.nodeCount()).toEqual(0)
})

removeNode('removes the node if it is in the graph', ({ graph }) => {
  graph.setNode('a')
  graph.removeNode('a')
  expect(graph.hasNode('a')).toBe(false)
  expect(graph.nodeCount()).toEqual(0)
})

removeNode('is idempotent', ({ graph }) => {
  graph.setNode('a')
  graph.removeNode('a')
  graph.removeNode('a')
  expect(graph.hasNode('a')).toBe(false)
  expect(graph.nodeCount()).toEqual(0)
})

removeNode('removes edges incident on the node', ({ graph }) => {
  graph.setEdge('a', 'b')
  graph.setEdge('b', 'c')
  graph.removeNode('b')
  expect(graph.edgeCount()).toEqual(0)
})

removeNode('is chainable', ({ graph }) => {
  expect(graph.removeNode('a')).toEqual(graph)
})

removeNode.run()

// ---

const setEdge = suite<Context>('setEdge')
setEdge.before.each(newGraph)

setEdge('creates the edge if it is not part of the graph', ({ graph }) => {
  graph.setNode('a')
  graph.setNode('b')
  graph.setEdge('a', 'b')
  expect(graph.edge('a', 'b')).toBe(null)
  expect(graph.hasEdge('a', 'b')).toBe(true)
  expect(graph.edgeCount()).toEqual(1)
})

setEdge('creates the nodes for the edge if they are not part of the graph', ({ graph }) => {
  graph.setEdge('a', 'b')
  expect(graph.hasNode('a')).toBe(true)
  expect(graph.hasNode('b')).toBe(true)
  expect(graph.nodeCount()).toEqual(2)
})

setEdge('changes the value for an edge if it is already in the graph', ({ graph }) => {
  graph.setEdge('a', 'b', 'foo')
  graph.setEdge('a', 'b', 'bar')
  expect(graph.edge('a', 'b')).toEqual('bar')
})

setEdge('treats edges in opposite directions as distinct in a digraph', ({ graph }) => {
  graph.setEdge('a', 'b')
  expect(graph.hasEdge('a', 'b')).toBe(true)
  expect(graph.hasEdge('b', 'a')).toBe(false)
})

setEdge('is chainable', ({ graph }) => {
  expect(graph.setEdge('a', 'b')).toEqual(graph)
})

setEdge.run()

// ---

const predecessors = suite<Context>('predecessors')
predecessors.before.each(newGraph)

predecessors('returns undefined for a node that is not in the graph', ({ graph }) => {
  expect(graph.predecessors('a')).toBe(undefined)
})

predecessors('returns the predecessors of a node', ({ graph }) => {
  graph.setEdge('a', 'b')
  graph.setEdge('b', 'c')
  graph.setEdge('a', 'a')
  expect(graph.predecessors('a')).toEqual(['a'])
  expect(graph.predecessors('b')).toEqual(['a'])
  expect(graph.predecessors('c')).toEqual(['b'])
})

predecessors.run()

// ---

const successors = suite<Context>('successors')
successors.before.each(newGraph)

successors('returns undefined for a node that is not in the graph', ({ graph }) => {
  expect(graph.successors('a')).toBe(undefined)
})

successors('returns the successors of a node', ({ graph }) => {
  graph.setEdge('a', 'b')
  graph.setEdge('b', 'c')
  graph.setEdge('a', 'a')
  expect(graph.successors('a')?.sort()).toEqual(['a', 'b'])
  expect(graph.successors('b')).toEqual(['c'])
  expect(graph.successors('c')).toEqual([])
})

successors.run()

// ---

const neighbors = suite<Context>('neighbors')
neighbors.before.each(newGraph)

neighbors('returns undefined for a node that is not in the graph', ({ graph }) => {
  expect(graph.neighbors('a')).toBe(undefined)
})

neighbors('returns the neighbors of a node', ({ graph }) => {
  graph.setEdge('a', 'b')
  graph.setEdge('b', 'c')
  graph.setEdge('a', 'a')
  expect(graph.neighbors('a')).toEqual(['a', 'b'])
  expect(graph.neighbors('b')).toEqual(['a', 'c'])
  expect(graph.neighbors('c')).toEqual(['b'])
})

neighbors.run()

// ---

const isLeaf = suite<Context>('isLeaf')
isLeaf.before.each(newGraph)

isLeaf('returns true for unconnected node in directed graph', ({ graph }) => {
  graph.setNode('a')
  expect(graph.isLeaf('a')).toBe(true)
})

isLeaf('returns false for predecessor node in directed graph', ({ graph }) => {
  graph.setNode('a')
  graph.setNode('b')
  graph.setEdge('a', 'b')
  expect(graph.isLeaf('a')).toBe(false)
})

isLeaf('returns true for successor node in directed graph', ({ graph }) => {
  graph.setNode('a')
  graph.setNode('b')
  graph.setEdge('a', 'b')
  expect(graph.isLeaf('b')).toBe(true)
})

isLeaf.run()

// ---

const edges = suite<Context>('edges')
edges.before.each(newGraph)

edges('is empty if there are no edges in the graph', ({ graph }) => {
  expect(graph.edges()).toEqual([])
})

edges('returns the keys for edges in the graph', ({ graph }) => {
  graph.setEdge('a', 'b')
  graph.setEdge('b', 'c')

  expect(graph.edges()).toEqual([
    { v: 'a', w: 'b' },
    { v: 'b', w: 'c' }
  ])
})

edges.run()

// ---

const edge = suite<Context>('edge')
edge.before.each(newGraph)

edge('returns undefined if the edge is not part of the graph', ({ graph }) => {
  expect(graph.edge('a', 'b')).toBe(undefined)
})

edge('returns the value of the edge if it is part of the graph', ({ graph }) => {
  graph.setEdge('a', 'b', { foo: 'bar' })
  expect(graph.edge('a', 'b')).toEqual({ foo: 'bar' })
  expect(graph.edge('b', 'a')).toBe(undefined)
})

edge.run()

// ---

const removeEdge = suite<Context>('removeEdge')
removeEdge.before.each(newGraph)

removeEdge('has no effect if the edge is not in the graph', ({ graph }) => {
  graph.removeEdge('a', 'b')
  expect(graph.hasEdge('a', 'b')).toBe(false)
  expect(graph.edgeCount()).toEqual(0)
})

removeEdge('correctly removes neighbors', ({ graph }) => {
  graph.setEdge('a', 'b')
  graph.removeEdge('a', 'b')
  expect(graph.successors('a')).toEqual([])
  expect(graph.neighbors('a')).toEqual([])
  expect(graph.predecessors('b')).toEqual([])
  expect(graph.neighbors('b')).toEqual([])
})

removeEdge('is chainable', ({ graph }) => {
  graph.setEdge('a', 'b')
  expect(graph.removeEdge('a', 'b')).toEqual(graph)
})

removeEdge.run()

// ---

const inEdges = suite<Context>('inEdges')
inEdges.before.each(newGraph)

inEdges('returns undefined for a node that is not in the graph', ({ graph }) => {
  expect(graph.inEdges('a')).toBe(undefined)
})

inEdges('returns the edges that point at the specified node', ({ graph }) => {
  graph.setEdge('a', 'b')
  graph.setEdge('b', 'c')
  expect(graph.inEdges('a')).toEqual([])
  expect(graph.inEdges('b')).toEqual([{ v: 'a', w: 'b' }])
  expect(graph.inEdges('c')).toEqual([{ v: 'b', w: 'c' }])
})

inEdges.run()

// ---

const outEdges = suite<Context>('outEdges')
outEdges.before.each(newGraph)

outEdges('returns undefined for a node that is not in the graph', ({ graph }) => {
  expect(graph.outEdges('a')).toBe(undefined)
})

outEdges('returns all edges that this node points at', ({ graph }) => {
  graph.setEdge('a', 'b')
  graph.setEdge('b', 'c')
  expect(graph.outEdges('a')).toEqual([{ v: 'a', w: 'b' }])
  expect(graph.outEdges('b')).toEqual([{ v: 'b', w: 'c' }])
  expect(graph.outEdges('c')).toEqual([])
})

outEdges.run()

// ---

const nodeEdges = suite<Context>('nodeEdges')
nodeEdges.before.each(newGraph)

nodeEdges('returns undefined for a node that is not in the graph', ({ graph }) => {
  expect(graph.nodeEdges('a')).toBe(undefined)
})

nodeEdges('returns all edges that this node points at', ({ graph }) => {
  graph.setEdge('a', 'b')
  graph.setEdge('b', 'c')
  expect(graph.nodeEdges('a')).toEqual([{ v: 'a', w: 'b' }])
  expect(graph.nodeEdges('b')).toEqual([{ v: 'a', w: 'b' }, { v: 'b', w: 'c' }])
  expect(graph.nodeEdges('c')).toEqual([{ v: 'b', w: 'c' }])
})

nodeEdges('can return only edges between specific nodes', ({ graph }) => {
  graph.setEdge('a', 'b')
  graph.setEdge('a', 'c')
  graph.setEdge('b', 'c')
  graph.setEdge('z', 'a')
  graph.setEdge('z', 'b')
  expect(graph.nodeEdges('a', 'b')).toEqual([{ v: 'a', w: 'b' }])
  expect(graph.nodeEdges('b', 'a')).toEqual([{ v: 'a', w: 'b' }])
})

nodeEdges.run()

import { Graph } from '../src/index'

interface Node {
  name: string
  metadata?: {
    [key: string]: string
  }
}

const graph =  new Graph<Node>()

graph.setNode('1', {
  name: 'foo',
  metadata: {
    bar: 'baz'
  }
})

graph.setNode('2', { name: 'bar' })

console.log(graph)

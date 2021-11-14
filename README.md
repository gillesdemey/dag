# dag

A directed acyclical graph library

## Installation

`npm install @gillesdemey/dag`

## Example

```javascript
import { Graph } from '@gillesdemey/dag'

/*
 * This will create a DAG that looks like this
 *
 *                           ┌───┐
 *                         ┌▶│ 5 │──┐
 *            ┌───┐  ┌───┐ │ └───┘  │   ┌───┐
 * ┌───┐   ┌─▶│ 2 │─▶│ 4 │─┤        ├──▶│ 8 │
 * │ 1 │───┤  └───┘  └───┘ │  ┌───┐ │   └───┘
 * └───┘   │               └─▶│ 6 │─┘     ▲
 *         │                  └───┘       │
 *         │   ┌───┐  ┌───┐               │
 *         └──▶│ 3 │─▶│ 7 │───────────────┘
 *             └───┘  └───┘
 *
 * ┌───┐       ┌───┐
 * │ 0 │──────▶│ 9 │
 * └───┘       └───┘
 */
const graph = new Graph()

graph.setEdge('1', '2')
graph.setEdge('1', '3')
graph.setEdge('2', '4')
graph.setEdge('3', '7')
graph.setEdge('4', '5')
graph.setEdge('4', '6')
graph.setEdge('5', '8')
graph.setEdge('6', '8')
graph.setEdge('7', '8')
graph.setEdge('0', '9')

graph.sources() // ['1', '0']
graph.sinks()   // ['8', '9']

```

## API

Soon-ish, check out the TypeScript source in the meantime :-)

## Acknowledgements

This project started as a fork of [https://github.com/dagrejs/graphlib](https://github.com/dagrejs/graphlib).

The API is inspired by it but is not aiming to be backwards compatible with it.

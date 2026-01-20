// Priority Queue implementation for Dijkstra's algorithm
export class PriorityQueue<T> {
  private items: Array<{ element: T; priority: number }> = [];

  enqueue(element: T, priority: number): void {
    const item = { element, priority };
    let added = false;

    for (let i = 0; i < this.items.length; i++) {
      if (item.priority < this.items[i].priority) {
        this.items.splice(i, 0, item);
        added = true;
        break;
      }
    }

    if (!added) {
      this.items.push(item);
    }
  }

  dequeue(): T | undefined {
    return this.items.shift()?.element;
  }

  isEmpty(): boolean {
    return this.items.length === 0;
  }

  size(): number {
    return this.items.length;
  }
}

// Edge representation in the graph
export interface Edge {
  to: string;
  weight: number;
  lineId: string;
  fromStation: string;
  toStation: string;
}

// Graph class for metro network
export class Graph {
  private adjacencyList: Map<string, Edge[]>;

  constructor() {
    this.adjacencyList = new Map();
  }

  addVertex(vertex: string): void {
    if (!this.adjacencyList.has(vertex)) {
      this.adjacencyList.set(vertex, []);
    }
  }

  addEdge(from: string, to: string, weight: number, lineId: string): void {
    this.addVertex(from);
    this.addVertex(to);

    this.adjacencyList.get(from)!.push({
      to,
      weight,
      lineId,
      fromStation: from,
      toStation: to,
    });
  }

  getNeighbors(vertex: string): Edge[] {
    return this.adjacencyList.get(vertex) || [];
  }

  hasVertex(vertex: string): boolean {
    return this.adjacencyList.has(vertex);
  }

  // Dijkstra's algorithm implementation
  findShortestPath(start: string, end: string): {
    path: string[];
    distance: number;
    edges: Edge[];
  } | null {
    if (!this.hasVertex(start) || !this.hasVertex(end)) {
      return null;
    }

    const distances = new Map<string, number>();
    const previous = new Map<string, { node: string; edge: Edge } | null>();
    const pq = new PriorityQueue<string>();

    // Initialize distances
    for (const vertex of this.adjacencyList.keys()) {
      distances.set(vertex, Infinity);
      previous.set(vertex, null);
    }
    distances.set(start, 0);
    pq.enqueue(start, 0);

    while (!pq.isEmpty()) {
      const current = pq.dequeue()!;

      if (current === end) {
        break;
      }

      const neighbors = this.getNeighbors(current);
      for (const edge of neighbors) {
        const distance = distances.get(current)! + edge.weight;

        if (distance < distances.get(edge.to)!) {
          distances.set(edge.to, distance);
          previous.set(edge.to, { node: current, edge });
          pq.enqueue(edge.to, distance);
        }
      }
    }

    // Reconstruct path
    const path: string[] = [];
    const edges: Edge[] = [];
    let current: string | null = end;

    if (!previous.get(end)) {
      return null; // No path found
    }

    while (current) {
      path.unshift(current);
      const prev = previous.get(current);
      if (prev && prev.node !== current) {
        edges.unshift(prev.edge);
        current = prev.node;
      } else {
        break;
      }
    }

    return {
      path,
      distance: distances.get(end)!,
      edges,
    };
  }
}

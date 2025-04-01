import { useEffect, useRef } from "react";
import * as d3 from "d3";

// Define Node and Link Types
interface Node {
  id: string;
  x?: number;
  y?: number;
  fx?: number | null;
  fy?: number | null;
}

interface Link {
  source: string | Node;
  target: string | Node;
}

interface GraphViewProps {
  nodes: Node[];
  links: Link[];
}

function GraphView({ nodes, links }: GraphViewProps) {
  const svgRef = useRef<SVGSVGElement | null>(null);
  const width = 800;
  const height = 600;

  useEffect(() => {
    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove(); // Clear previous elements

    if (!nodes.length || !links.length) return;

    // Create container group
    const container = svg
      .attr("viewBox", [0, 0, width, height])
      .append("g")
      .attr("class", "graph-container");

    // Add links (edges)
    const linkSelection = container
      .append("g")
      .attr("stroke", "#aaa")
      .attr("stroke-opacity", 0.7)
      .selectAll("line")
      .data(links)
      .join("line");

    // Add nodes (circles)
    const nodeSelection = container
      .append("g")
      .selectAll("circle")
      .data(nodes)
      .join("circle")
      .attr("r", 10)
      .attr("fill", "#69b3a2")
      .call(
        d3.drag<SVGCircleElement, Node>()
          .on("start", function (event, d) {
            const node = d as Node; // Explicitly cast d to Node
            if (!event.active) simulation.alphaTarget(0.3).restart();
            node.fx = node.x;
            node.fy = node.y;
          })
          .on("drag", function (event, d) {
            const node = d as Node;
            node.fx = event.x;
            node.fy = event.y;
          })
          .on("end", function (event, d) {
            const node = d as Node;
            if (!event.active) simulation.alphaTarget(0);
            node.fx = null;
            node.fy = null;
          }) as unknown as (selection: d3.Selection<d3.BaseType, Node, SVGGElement, unknown>) => void
      );


    // Create force simulation
    const simulation = d3
      .forceSimulation(nodes)
      .force(
        "link",
        d3
          .forceLink<Node, Link>(links)
          .id((d) => d.id)
          .distance(80)
      )
      .force("charge", d3.forceManyBody().strength(-250))
      .force("center", d3.forceCenter(width / 2, height / 2))
      .on("tick", () => {
        linkSelection
          .attr("x1", (d) => (d.source as Node).x || 0)
          .attr("y1", (d) => (d.source as Node).y || 0)
          .attr("x2", (d) => (d.target as Node).x || 0)
          .attr("y2", (d) => (d.target as Node).y || 0);

        nodeSelection
          .attr("cx", (d) => d.x || 0)
          .attr("cy", (d) => d.y || 0);
      });

    return () => {
      simulation.stop();
    };
  }, [nodes, links]);

  return <svg ref={svgRef} width="100%" height="100vh"></svg>;
}

export default GraphView;

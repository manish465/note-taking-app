import { useEffect, useRef } from 'react';
import * as d3 from 'd3';

// Define TypeScript interfaces for nodes and links
interface Node {
  id: string;
  x?: number; // Optional, as d3 will add these dynamically
  y?: number; // Optional, as d3 will add these dynamically
  vx?: number; // Velocity in x direction
  vy?: number; // Velocity in y direction
  fx?: number | null; // Fixed x position
  fy?: number | null; // Fixed y position
}

interface Link {
  source: string | Node; // Can be a string (id) or a Node object
  target: string | Node; // Can be a string (id) or a Node object
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
    d3.select(svgRef.current).selectAll("*").remove(); // Clear previous SVG content

    if (!nodes || !links) return;

    // Select the SVG element and set up the viewBox
    const svg = d3.select(svgRef.current)
      .attr("viewBox", [0, 0, width, height])
      .append("g");

    // Create links (lines)
    const link = svg.append("g")
      .selectAll("line")
      .data(links)
      .enter()
      .append("line")
      .attr("stroke", "#999")
      .attr("stroke-opacity", 0.6);

    // Create nodes (circles)
    const node = svg.append("g")
      .selectAll("circle")
      .data(nodes)
      .enter()
      .append("circle")
      .attr("r", 8)
      .attr("fill", "#69b3a2")
      .call(
        d3.drag<SVGCircleElement, Node>() // Add drag behavior
          .on("start", (event, d) => {
            if (!event.active) simulation.alphaTarget(0.3).restart(); // Restart simulation
            d.fx = d.x; // Fix x position
            d.fy = d.y; // Fix y position
          })
          .on("drag", (event, d) => {
            d.fx = event.x; // Update fixed x position
            d.fy = event.y; // Update fixed y position
          })
          .on("end", (event, d) => {
            if (!event.active) simulation.alphaTarget(0); // Stop simulation
            d.fx = null; // Release fixed x position
            d.fy = null; // Release fixed y position
          })
      );

    // Set up the simulation
    const simulation = d3.forceSimulation<Node>(nodes)
      .force(
        "link",
        d3.forceLink<Node, Link>(links)
          .id((d) => d.id)
          .distance(50)
      )
      .force("charge", d3.forceManyBody().strength(-200))
      .force("center", d3.forceCenter(width / 2, height / 2))
      .on("tick", () => {
        link
          .attr("x1", (d) => (typeof d.source === "object" && d.source.x !== undefined ? d.source.x : 0))
          .attr("y1", (d) => (typeof d.source === "object" && d.source.y !== undefined ? d.source.y : 0))
          .attr("x2", (d) => (typeof d.target === "object" && d.target.x !== undefined ? d.target.x : 0))
          .attr("y2", (d) => (typeof d.target === "object" && d.target.y !== undefined ? d.target.y : 0));

        node
          .attr("cx", (d) => d.x || 0)
          .attr("cy", (d) => d.y || 0);
      });

    // Cleanup function to stop the simulation
    return () => {
      simulation.stop();
    };
  }, [nodes, links]);

  return <svg ref={svgRef} width="100%" height="100vh"></svg>;
}

export default GraphView;
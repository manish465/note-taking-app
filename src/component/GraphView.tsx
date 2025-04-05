import { useEffect, useRef, useState } from "react";
import * as d3 from "d3";

// Define Node and Link Types
interface Node {
  id: string;
  name: string;
  type?: string;
  x?: number;
  y?: number;
  fx?: number | null;
  fy?: number | null;
}

// Use a separate interface for processed nodes
interface ProcessedNode extends Node {
  index?: number;
}

interface Link {
  source: string | Node | ProcessedNode;
  target: string | Node | ProcessedNode;
  type?: string;
  strength?: number;
}

interface GraphViewProps {
  nodes: Node[];
  links: Link[];
  width?: number;
  height?: number;
  nodeColors?: Record<string, string>;
  onNodeClick?: (node: Node) => void;
}

function GraphView({ 
  nodes, 
  links, 
  width = 800, 
  height = 600,
  nodeColors = { default: "#69b3a2" },
  onNodeClick
}: GraphViewProps) {
  const svgRef = useRef<SVGSVGElement | null>(null);
  const [zoom, setZoom] = useState<d3.ZoomBehavior<SVGSVGElement, unknown> | null>(null);

  useEffect(() => {
    if (!nodes.length) return;

    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove(); // Clear previous elements

    // Create container group first
    const container = svg
      .attr("viewBox", [0, 0, width, height])
      .append("g")
      .attr("class", "graph-container");

    // Create zoom behavior after container is defined
    const zoomBehavior = d3.zoom<SVGSVGElement, unknown>()
      .scaleExtent([0.1, 4])
      .on("zoom", (event) => {
        container.attr("transform", event.transform);
      });

    setZoom(zoomBehavior);
    
    // Fix TypeScript error: Check if SVG element exists and apply zoom safely
    if (svgRef.current) {
      svg.call(zoomBehavior as any); // Cast to any to avoid TypeScript error
    }

    // Add tooltip
    const tooltip = d3.select("body")
      .append("div")
      .attr("class", "graph-tooltip")
      .style("position", "absolute")
      .style("visibility", "hidden")
      .style("background-color", "white")
      .style("border", "1px solid #ddd")
      .style("border-radius", "3px")
      .style("padding", "5px")
      .style("pointer-events", "none");

    // Process links to ensure they reference node objects
    // Fix: Create nodes with proper typing
    const nodeMap = new Map(nodes.map(node => [node.id || node.name, node as ProcessedNode]));
    
    // Fix: Properly type the processed links
    const processedLinks = links.map(link => {
      // Get the source node from the map or create a compatible one
      const source = typeof link.source === 'string' 
        ? (nodeMap.get(link.source) || { id: link.source, name: link.source } as ProcessedNode)
        : link.source as ProcessedNode;
        
      // Get the target node from the map or create a compatible one
      const target = typeof link.target === 'string'
        ? (nodeMap.get(link.target) || { id: link.target, name: link.target } as ProcessedNode)
        : link.target as ProcessedNode;
        
      return { ...link, source, target };
    });

    // Add links with optional arrow markers
    container.append("defs").selectAll("marker")
      .data(["arrow"])
      .enter().append("marker")
      .attr("id", d => d)
      .attr("viewBox", "0 -5 10 10")
      .attr("refX", 15)
      .attr("refY", 0)
      .attr("markerWidth", 6)
      .attr("markerHeight", 6)
      .attr("orient", "auto")
      .append("path")
      .attr("d", "M0,-5L10,0L0,5");

    const linkSelection = container
      .append("g")
      .attr("class", "links")
      .selectAll("line")
      .data(processedLinks)
      .join("line")
      .attr("stroke", "#aaa")
      .attr("stroke-opacity", 0.7)
      .attr("stroke-width", d => d.strength ? 1 + d.strength : 1)
      .attr("marker-end", d => d.type === "directed" ? "url(#arrow)" : "");

    // Add node circles
    const nodeGroup = container.append("g").attr("class", "nodes");
    
    const nodeSelection = nodeGroup
      .selectAll("circle")
      .data(nodes)
      .join("circle")
      .attr("r", 10)
      .attr("fill", d => nodeColors[d.type || "default"] || nodeColors.default)
      .attr("stroke", "#fff")
      .attr("stroke-width", 1.5)
      .style("cursor", "pointer")
      .on("mouseover", (event, d) => {
        tooltip
          .style("visibility", "visible")
          .html(d.name)
          .style("left", (event.pageX + 10) + "px")
          .style("top", (event.pageY - 10) + "px");
        
        // Fix: Properly handle source/target references with typeguards
        linkSelection
          .attr("stroke-opacity", l => {
            const source = l.source as ProcessedNode;
            const target = l.target as ProcessedNode;
            
            return (source.id === d.id || source.name === d.name || 
                   target.id === d.id || target.name === d.name) ? 1 : 0.2;
          });
        
        nodeSelection
          .attr("opacity", n => 
            isConnected(d, n, processedLinks) ? 1 : 0.4
          );
      })
      .on("mouseout", () => {
        tooltip.style("visibility", "hidden");
        linkSelection.attr("stroke-opacity", 0.7);
        nodeSelection.attr("opacity", 1);
      })
      .on("click", (event, d) => {
        if (onNodeClick) onNodeClick(d);
      })
      .call(
        d3.drag<SVGCircleElement, Node>()
          .on("start", function (event, d) {
            if (!event.active) simulation.alphaTarget(0.3).restart();
            d.fx = d.x;
            d.fy = d.y;
          })
          .on("drag", function (event, d) {
            d.fx = event.x;
            d.fy = event.y;
          })
          .on("end", function (event, d) {
            if (!event.active) simulation.alphaTarget(0);
            // Keep nodes in place after dragging (comment these out to release)
            // d.fx = null;
            // d.fy = null;
          }) as unknown as (selection: d3.Selection<d3.BaseType, Node, SVGGElement, unknown>) => void
      );

    // Add text labels
    const textSelection = nodeGroup
      .selectAll("text")
      .data(nodes)
      .join("text")
      .attr("dx", 15)
      .attr("dy", 4)
      .text(d => d.name)
      .style("font-size", "12px")
      .style("font-family", "sans-serif")
      .style("pointer-events", "none");

    // Create improved force simulation
    // Fix: Cast processedLinks to any to avoid TypeScript errors with d3 typings
    const simulation = d3
      .forceSimulation(nodes as d3.SimulationNodeDatum[])
      .force(
        "link",
        d3
          .forceLink(processedLinks as any)
          .id((d: any) => d.id || d.name)
          .distance((d: any) => d.strength ? 100 / (d.strength + 0.5) : 100)
      )
      .force("charge", d3.forceManyBody()
        .strength(-300)
        .distanceMax(300)
      )
      .force("center", d3.forceCenter(width / 2, height / 2))
      .force("x", d3.forceX(width / 2).strength(0.05))
      .force("y", d3.forceY(height / 2).strength(0.05))
      .force("collision", d3.forceCollide().radius(25))
      .alphaDecay(0.028) // Slower decay for better layout
      .on("tick", () => {
        // Update positions on each tick
        linkSelection
          .attr("x1", d => (d.source as ProcessedNode).x || 0)
          .attr("y1", d => (d.source as ProcessedNode).y || 0)
          .attr("x2", d => (d.target as ProcessedNode).x || 0)
          .attr("y2", d => (d.target as ProcessedNode).y || 0);

        nodeSelection
          .attr("cx", d => d.x || 0)
          .attr("cy", d => d.y || 0);

        textSelection
          .attr("x", d => d.x || 0)
          .attr("y", d => d.y || 0);
      });

    // Helper function to check if nodes are connected
    function isConnected(a: Node, b: Node, links: Link[]) {
      if (a.id === b.id || a.name === b.name) return true;
      
      return links.some(link => {
        const source = link.source as ProcessedNode;
        const target = link.target as ProcessedNode;
        
        return (source.id === a.id && target.id === b.id) ||
               (source.id === b.id && target.id === a.id) ||
               (source.name === a.name && target.name === b.name) ||
               (source.name === b.name && target.name === a.name);
      });
    }

    // Initial simulation heating
    simulation.alpha(1).restart();

    return () => {
      simulation.stop();
      d3.select("body").selectAll(".graph-tooltip").remove();
    };
  }, [nodes, links, width, height, nodeColors, onNodeClick]);

  // Export resetZoom function for external use if needed
  const resetZoom = () => {
    if (zoom && svgRef.current) {
      d3.select(svgRef.current)
        .transition()
        .duration(750)
        .call((zoom.transform as any), d3.zoomIdentity);
    }
  };

  return (
    <div className="graph-view-container" style={{ width: "100%", height: "100%" }}>
      <svg ref={svgRef} width="100%" height="100%"></svg>
      {/* You can add a reset zoom button that uses the function if needed */}
    </div>
  );
}

export default GraphView;
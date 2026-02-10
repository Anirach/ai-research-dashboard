"use client";

import { useRef, useEffect, useState } from "react";
import * as d3 from "d3";

interface Node {
  id: string;
  arxivId?: string;
  title: string;
  citationCount?: number;
  x?: number;
  y?: number;
  fx?: number | null;
  fy?: number | null;
}

interface Link {
  source: string | Node;
  target: string | Node;
}

interface CitationNetworkProps {
  nodes: Node[];
  links: Link[];
  width?: number;
  height?: number;
  onNodeClick?: (node: Node) => void;
}

export function CitationNetwork({
  nodes,
  links,
  width = 800,
  height = 600,
  onNodeClick,
}: CitationNetworkProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const [dimensions, setDimensions] = useState({ width, height });

  useEffect(() => {
    const handleResize = () => {
      if (svgRef.current?.parentElement) {
        const parent = svgRef.current.parentElement;
        setDimensions({
          width: parent.clientWidth,
          height: Math.max(400, parent.clientHeight),
        });
      }
    };

    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    if (!svgRef.current || nodes.length === 0) return;

    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove();

    const { width: w, height: h } = dimensions;

    const g = svg.append("g");

    const zoom = d3
      .zoom<SVGSVGElement, unknown>()
      .scaleExtent([0.1, 4])
      .on("zoom", (event) => {
        g.attr("transform", event.transform);
      });

    svg.call(zoom);

    const nodesCopy = nodes.map((d) => ({ ...d }));
    const linksCopy = links.map((d) => ({ ...d }));

    const simulation = d3
      .forceSimulation(nodesCopy)
      .force(
        "link",
        d3
          .forceLink<Node, { source: string | Node; target: string | Node }>(linksCopy)
          .id((d) => d.id)
          .distance(100)
      )
      .force("charge", d3.forceManyBody().strength(-300))
      .force("center", d3.forceCenter(w / 2, h / 2))
      .force("collision", d3.forceCollide().radius(30));

    svg
      .append("defs")
      .append("marker")
      .attr("id", "arrowhead")
      .attr("viewBox", "-0 -5 10 10")
      .attr("refX", 20)
      .attr("refY", 0)
      .attr("orient", "auto")
      .attr("markerWidth", 6)
      .attr("markerHeight", 6)
      .append("path")
      .attr("d", "M 0,-5 L 10 ,0 L 0,5")
      .attr("fill", "#999");

    const link = g
      .append("g")
      .selectAll("line")
      .data(linksCopy)
      .join("line")
      .attr("stroke", "#999")
      .attr("stroke-opacity", 0.6)
      .attr("stroke-width", 1)
      .attr("marker-end", "url(#arrowhead)");

    const sizeScale = d3
      .scaleLog()
      .domain([1, Math.max(...nodes.map((n) => n.citationCount || 1))])
      .range([6, 20]);

    const dragBehavior = d3
      .drag<SVGGElement, Node>()
      .on("start", (event, d) => {
        if (!event.active) simulation.alphaTarget(0.3).restart();
        d.fx = d.x;
        d.fy = d.y;
      })
      .on("drag", (event, d) => {
        d.fx = event.x;
        d.fy = event.y;
      })
      .on("end", (event, d) => {
        if (!event.active) simulation.alphaTarget(0);
        d.fx = null;
        d.fy = null;
      });

    const node = g
      .append("g")
      .selectAll<SVGGElement, Node>("g")
      .data(nodesCopy)
      .join("g")
      .attr("cursor", "pointer")
      .call(dragBehavior);

    node
      .append("circle")
      .attr("r", (d) => sizeScale(d.citationCount || 1))
      .attr("fill", (d) => (d.arxivId ? "#6366f1" : "#94a3b8"))
      .attr("stroke", "#fff")
      .attr("stroke-width", 2);

    node
      .append("title")
      .text((d) => `${d.title}\n${d.citationCount || 0} citations`);

    node.on("click", (event, d) => {
      event.stopPropagation();
      onNodeClick?.(d);
    });

    const labels = g
      .append("g")
      .selectAll("text")
      .data(nodesCopy)
      .join("text")
      .text((d) => {
        const maxLen = 25;
        return d.title.length > maxLen
          ? d.title.substring(0, maxLen) + "..."
          : d.title;
      })
      .attr("font-size", "10px")
      .attr("fill", "#374151")
      .attr("text-anchor", "middle")
      .attr("dy", (d) => sizeScale(d.citationCount || 1) + 12);

    simulation.on("tick", () => {
      link
        .attr("x1", (d) => (d.source as Node).x || 0)
        .attr("y1", (d) => (d.source as Node).y || 0)
        .attr("x2", (d) => (d.target as Node).x || 0)
        .attr("y2", (d) => (d.target as Node).y || 0);

      node.attr("transform", (d) => `translate(${d.x || 0},${d.y || 0})`);
      labels.attr("x", (d) => d.x || 0).attr("y", (d) => d.y || 0);
    });

    return () => {
      simulation.stop();
    };
  }, [nodes, links, dimensions, onNodeClick]);

  return (
    <svg
      ref={svgRef}
      width="100%"
      height={dimensions.height}
      className="bg-background rounded-lg border"
    />
  );
}

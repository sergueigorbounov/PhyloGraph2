// ✅ PhyloTreeRadial.jsx — Radial Scientific Tree Viewer with Modal & Species Badge
import React, { useRef, useEffect, useState } from 'react';
import * as d3 from 'd3';
import fallbackTreeData from '../data/fallback_tree.json';
import NodeModal from './NodeModal';

export default function PhyloTreeRadial({ onNodeClick }) {
  const svgRef = useRef();
  const [selectedNode, setSelectedNode] = useState(null);

  useEffect(() => {
    drawRadialTree(fallbackTreeData);
  }, []);

  const drawRadialTree = (data) => {
    const width = 600;
    const radius = width / 2;
    const tree = d3.tree().size([2 * Math.PI, radius - 100]);
    const root = d3.hierarchy(data);
    tree(root);

    d3.select(svgRef.current).selectAll("*").remove();
    const svg = d3.select(svgRef.current)
      .attr("viewBox", [-radius, -radius, width, width])
      .style("font", "14px sans-serif");

    const link = svg.append("g")
      .attr("fill", "none")
      .attr("stroke", "white")
      .attr("stroke-width", 2)
      .selectAll("path")
      .data(root.links())
      .join("path")
      .attr("d", d3.linkRadial()
        .angle(d => d.x)
        .radius(d => d.y));

    const node = svg.append("g")
      .selectAll("g")
      .data(root.descendants())
      .join("g")
      .attr("transform", d => `
        rotate(${d.x * 180 / Math.PI - 90})
        translate(${d.y},0)
      `);

    node.append("circle")
      .attr("r", 5)
      .attr("fill", "#4ade80")
      .attr("stroke", "#86efac")
      .attr("stroke-width", 2)
      .on("click", (e, d) => {
        setSelectedNode({
          label: d.data.name,
          id: d.data.name,
          type: "Gene",
          ...d.data.attributes,
        });
        if (onNodeClick) onNodeClick(d.data.name);
      });

    node.append("text")
      .attr("dy", "0.31em")
      .attr("x", d => d.x < Math.PI ? 10 : -10)
      .attr("text-anchor", d => d.x < Math.PI ? "start" : "end")
      .attr("transform", d => d.x >= Math.PI ? "rotate(180)" : null)
      .text(d => d.data.name)
      .attr("fill", "white")
      .attr("font-weight", "bold");

    node.append("text")
      .attr("dy", "1.6em")
      .attr("x", d => d.x < Math.PI ? 10 : -10)
      .attr("text-anchor", d => d.x < Math.PI ? "start" : "end")
      .attr("transform", d => d.x >= Math.PI ? "rotate(180)" : null)
      .text(d => d.data.attributes?.species || "")
      .attr("fill", "#aaa")
      .attr("font-size", "10px");
  };

  return (
    <div className="bg-black rounded-lg p-4 border border-zinc-700">
      <svg ref={svgRef} width="100%" height="500px" />
      {selectedNode && (
        <NodeModal
          node={selectedNode}
          onClose={() => setSelectedNode(null)}
        />
      )}
    </div>
  );
}

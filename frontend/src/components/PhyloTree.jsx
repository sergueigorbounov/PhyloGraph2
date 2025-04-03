// ✅ PhyloTree.jsx — Bulletproof Fallback Tree with Beautiful Styling
import React, { useRef, useEffect, useState } from 'react';
import Tree from 'react-d3-tree';
import fallbackTreeData from '../data/fallback_tree.json' assert { type: "json" };

const fallbackTreeData = {
  name: "DemoOrtholog1",
  children: [
    {
      name: "Gene1",
      attributes: {
        species: "Arabidopsis thaliana",
        function: "Root development",
      },
    },
    {
      name: "FallbackGene1",
      attributes: {
        species: "Zea mays",
        function: "Drought response",
      },
    },
    {
      name: "FallbackGene2",
      attributes: {
        species: "Oryza sativa",
        function: "Grain size",
      },
    },
  ],
};

const containerStyles = {
  width: '100%',
  height: '60vh',
  backgroundColor: '#111',
  borderRadius: '0.5rem',
  padding: '1rem',
};

const nodeSvgShape = {
  shape: 'rect',
  shapeProps: {
    width: 120,
    height: 40,
    x: -60,
    y: -20,
    rx: 10,
    ry: 10,
    fill: '#4ade80', // emerald-400
    stroke: '#86efac', // emerald-300
    strokeWidth: 2,
  },
};

const textLayout = {
  textAnchor: 'middle',
  x: 0,
  y: 5,
  style: {
    fill: 'white',
    fontSize: '14px',
    fontWeight: 'bold',
  },
};

export default function PhyloTree({ groupId = "DemoOrtholog1", onNodeClick }) {
  const treeRef = useRef();
  const [translate, setTranslate] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const dimensions = treeRef.current?.getBoundingClientRect();
    if (dimensions) {
      setTranslate({
        x: dimensions.width / 2,
        y: dimensions.height / 3,
      });
    }
  }, []);

  return (
    <div ref={treeRef} style={containerStyles}>
      <Tree
        data={fallbackTreeData}
        translate={translate}
        orientation="vertical"
        separation={{ siblings: 1, nonSiblings: 1.5 }}
        zoomable
        zoom={0.8}
        nodeSize={{ x: 180, y: 120 }}
        enableLegacyTransitions
        transitionDuration={500}
        nodeSvgShape={nodeSvgShape}
        pathFunc="elbow"
        styles={{
          nodes: {
            node: { name: textLayout, attributes: textLayout },
            leafNode: { name: textLayout, attributes: textLayout },
          },
          links: {
            stroke: '#4ade80',
            strokeWidth: 2,
          },
        }}
        onNodeClick={(node) => {
          if (onNodeClick) onNodeClick(node.name);
        }}
      />
    </div>
  );
}

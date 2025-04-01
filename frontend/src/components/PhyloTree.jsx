import { useEffect, useState, useRef, forwardRef, useImperativeHandle } from 'react';
import Tree from 'react-d3-tree';
import useOrthologTreeData from '../hooks/useOrthologTreeData';

const PhyloTree = forwardRef(({ groupId, onNodeClick }, ref) => {
  const { treeData, loading } = useOrthologTreeData(groupId);
  const containerRef = useRef(null);
  const treeRef = useRef(null);
  const [dimensions, setDimensions] = useState({ x: 150, y: 60 });
  const [orientation, setOrientation] = useState(localStorage.getItem('treeOrientation') || 'horizontal');
  const [highlightedId, setHighlightedId] = useState(null);

  useImperativeHandle(ref, () => ({
    highlightNode: (id) => setHighlightedId(id),
    zoomIn: () => treeRef.current?.zoom(0.3),
    zoomOut: () => treeRef.current?.zoom(-0.3),
    centerRootNode: () => treeRef.current?.centerRootNode(),
  }));

  useEffect(() => {
    if (containerRef.current) {
      const { width, height } = containerRef.current.getBoundingClientRect();
      setDimensions({ x: width / 3, y: height / 2 });
    }
  }, [groupId, orientation]);

  useEffect(() => {
    localStorage.setItem('treeOrientation', orientation);
  }, [orientation]);

  const exportSVG = () => {
    const svg = containerRef.current?.querySelector('svg');
    if (!svg) return;
    const serializer = new XMLSerializer();
    const source = serializer.serializeToString(svg);
    const blob = new Blob([source], { type: 'image/svg+xml;charset=utf-8' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'tree.svg';
    a.click();
  };

  const renderNode = ({ nodeDatum, toggleNode }) => {
    const isHighlighted = highlightedId && nodeDatum.name.includes(highlightedId);
    const icon = nodeDatum.attributes?.function ? '🧬' : nodeDatum.attributes?.location ? '🌿' : '🔹';
    return (
      <g onClick={toggleNode} className="cursor-pointer">
        <circle
          r={6}
          fill={isHighlighted ? '#22d3ee' : '#888'}
          className={isHighlighted ? 'animate-pulse' : ''}
        />
        <text fill="#e5e5e5" x={10} dy=".35em" fontSize={9}>
          {icon} {nodeDatum.name}
        </text>
      </g>
    );
  };

  if (!groupId) return <p className="text-xs text-zinc-400">Select a group to view tree.</p>;
  if (loading) return <p className="text-xs text-zinc-400">Loading tree...</p>;
  if (!treeData) return <p className="text-xs text-zinc-500">No tree data found.</p>;

  return (
    <div className="w-full h-[calc(100vh-64px-80px)] bg-black rounded-xl text-white flex flex-col gap-4 px-4 py-6">
      {/* Header */}
      <div className="flex justify-between items-center px-2">
        <h2 className="text-lg font-semibold">Phylogenetic Tree</h2>
        <div className="flex gap-2">
          <button
            onClick={() => setOrientation(o => o === 'horizontal' ? 'vertical' : 'horizontal')}
            className="text-xs px-2 py-1 bg-zinc-800 border border-zinc-600 rounded hover:bg-zinc-700"
          >
            Toggle Orientation
          </button>
          <button
            onClick={exportSVG}
            className="text-xs px-2 py-1 bg-zinc-800 border border-zinc-600 rounded hover:bg-zinc-700"
          >
            Export SVG
          </button>
        </div>
      </div>

      {/* Tree Viewport */}
      <div
        ref={containerRef}
        className="flex-1 bg-black rounded-lg overflow-hidden border border-zinc-700"
      >
        <Tree
          data={treeData}
          orientation={orientation}
          translate={dimensions}
          renderCustomNodeElement={renderNode}
          pathFunc="elbow"
          collapsible
          zoomable
          separation={{ siblings: 1.5, nonSiblings: 2 }}
          ref={treeRef}
        />
      </div>
    </div>
  );
});

export default PhyloTree;

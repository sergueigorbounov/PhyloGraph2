import { useEffect, useState, forwardRef, useImperativeHandle } from 'react';
import Tree from 'react-d3-tree';
import useOrthologTreeData from '../hooks/useOrthologTreeData';

const PhyloTree = forwardRef(({ groupId, onNodeClick }, ref) => {
  const { treeData, loading } = useOrthologTreeData(groupId);
  const [highlightedId, setHighlightedId] = useState(null);

  useImperativeHandle(ref, () => ({
    highlightNode: (id) => setHighlightedId(id)
  }));

  const renderNode = ({ nodeDatum }) => {
    const isHighlighted = highlightedId && nodeDatum.name.includes(highlightedId);
    return (
      <g>
        <circle r={10} fill={isHighlighted ? '#22d3ee' : '#888'} />
        <text fill="white" x={15} dy=".35em">{nodeDatum.name}</text>
      </g>
    );
  };

  if (loading) return <p className="text-sm text-gray-400">Loading tree...</p>;
  if (!treeData) return <p className="text-sm text-gray-500">No tree data available</p>;

  return (
    <div style={{ width: '100%', height: '250px', overflow: 'hidden' }}>
      <Tree
        data={treeData}
        orientation="horizontal"
        translate={{ x: 150, y: 125 }}
        renderCustomNodeElement={renderNode}
        pathFunc="elbow"
        onNodeClick={(node) => {
          const id = node.name.match(/\((.*?)\)/)?.[1] || node.name;
          onNodeClick?.(id);
        }}
        zoomable={false}
        collapsible={false}
      />
    </div>
  );
});

export default PhyloTree;

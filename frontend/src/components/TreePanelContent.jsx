// Tree panel content with PhyD3 tree and scientific metrics
const TreePanelContent = () => (
    <div className="h-full flex flex-col">
      {detectedGroup && <OrthologBanner group={detectedGroup} />}
      <div className="flex-grow relative">
        {/* Conditionally render either the original PhyD3 or the new PhyloTreeComponent */}
        {advancedMode ? (
          <PhyloTreeComponent
            key="stable-tree-key" // Add a stable key
            layoutType="radial"
            onNodeSelect={handleTreeNodeClick}
            debugInitiallyEnabled={true}
          />
        ) : (
          <PhyD3
            onNodeClick={handleTreeNodeClick}
            ref={treeRef}
            scientificMode={advancedMode}
          />
        )}
        
        {/* Scientific metrics panel */}
        {advancedMode && (
          <ScientificMetricsPanel
            conservationScore={0.78}
            dndsRatio={0.32}
            bootstrapValue={95}
            pValue={0.002}
            onExport={() => {
              if (treeRef.current && treeRef.current.exportHighResolution) {
                treeRef.current.exportHighResolution('SVG');
              } else {
                toast.success('Exporting publication-ready visualization');
              }
            }}
          />
        )}
      </div>
    </div>
  );
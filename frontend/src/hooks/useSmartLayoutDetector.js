/**

 * SmartLayoutDetector - A utility to suggest optimal layouts based on data

 * This would analyze your tree and graph data to recommend the best layout

 */

const useSmartLayoutDetector = (treeData, graphData) => {

    const [recommendedLayout, setRecommendedLayout] = useState(null);
  
    const [layoutReason, setLayoutReason] = useState('');
  
    
  
    useEffect(() => {
  
      // Simple heuristic: If tree has many nodes but graph is small, focus on tree
  
      if (treeData && graphData) {
  
        const treeNodeCount = treeData.nodes?.length || 0;
  
        const graphNodeCount = graphData.nodes?.length || 0;
  
        
  
        if (treeNodeCount > 100 && graphNodeCount < 20) {
  
          setRecommendedLayout(LAYOUTS.SPLIT_HORIZONTAL);
  
          setLayoutReason('Large tree detected - horizontal split recommended for better visibility');
  
        } else if (graphNodeCount > 100 && treeNodeCount < 20) {
  
          setRecommendedLayout(LAYOUTS.SPLIT_VERTICAL);
  
          setLayoutReason('Complex graph detected - vertical split recommended for better analysis');
  
        } else if (treeNodeCount > 50 && graphNodeCount > 50) {
  
          setRecommendedLayout(LAYOUTS.GRID);
  
          setLayoutReason('Both visualizations are complex - grid layout recommended');
  
        } else if (treeNodeCount < 10 && graphNodeCount < 10) {
  
          setRecommendedLayout(LAYOUTS.PIP);
  
          setLayoutReason('Simple visualizations detected - PIP layout for compact viewing');
  
        }
  
      }
  
    }, [treeData, graphData]);
  
    
  
    return { recommendedLayout, layoutReason };
  
  };
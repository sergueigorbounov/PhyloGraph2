/**

 * LayoutStateManager - Hook to manage layout state history

 * This would allow users to go back/forward through layout changes

 */

const useLayoutStateManager = (initialLayout) => {

    const [layoutHistory, setLayoutHistory] = useState([initialLayout]);
  
    const [currentIndex, setCurrentIndex] = useState(0);
  
    
  
    const setLayout = useCallback((newLayout) => {
  
      setLayoutHistory(prev => {
  
        // Remove any forward history when setting a new state
  
        const newHistory = prev.slice(0, currentIndex + 1);
  
        return [...newHistory, newLayout];
  
      });
  
      setCurrentIndex(prev => prev + 1);
  
    }, [currentIndex]);
  
    
  
    const goBack = useCallback(() => {
  
      if (currentIndex > 0) {
  
        setCurrentIndex(prev => prev - 1);
  
      }
  
    }, [currentIndex]);
  
    
  
    const goForward = useCallback(() => {
  
      if (currentIndex < layoutHistory.length - 1) {
  
        setCurrentIndex(prev => prev + 1);
  
      }
  
    }, [currentIndex, layoutHistory.length]);
  
    
  
    const canGoBack = currentIndex > 0;
  
    const canGoForward = currentIndex < layoutHistory.length - 1;
  
    
  
    return {
  
      currentLayout: layoutHistory[currentIndex],
  
      setLayout,
  
      goBack,
  
      goForward,
  
      canGoBack,
  
      canGoForward,
  
      layoutHistoryLength: layoutHistory.length
  
    };
  
  };
  
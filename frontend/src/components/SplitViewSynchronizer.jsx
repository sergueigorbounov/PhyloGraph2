/**

 * SplitViewSynchronizer - Component to handle view synchronization

 * This would be used in your layout components to manage synchronized 

 * selection, zooming and highlighting across views

 */

const SplitViewSynchronizer = ({ 

    enabled = true, 
  
    children, 
  
    onSync,
  
    syncTypes = ['selection', 'zoom', 'highlight']
  
  }) => {
  
    const [isSyncing, setIsSyncing] = useState(false);
  
    const syncTimeoutRef = useRef(null);
  
    
  
    const handleSync = useCallback((type, data) => {
  
      if (!enabled) return;
  
      
  
      setIsSyncing(true);
  
      if (syncTimeoutRef.current) clearTimeout(syncTimeoutRef.current);
  
      
  
      if (onSync) onSync(type, data);
  
      
  
      syncTimeoutRef.current = setTimeout(() => {
  
        setIsSyncing(false);
  
      }, 500);
  
    }, [enabled, onSync]);
  
    
  
    useEffect(() => {
  
      return () => {
  
        if (syncTimeoutRef.current) clearTimeout(syncTimeoutRef.current);
  
      };
  
    }, []);
  
    
  
    return (
  
      <div className="relative w-full h-full">
  
        {children(handleSync)}
  
        <ViewSyncIndicator active={isSyncing} />
  
      </div>
  
    );
  
  };
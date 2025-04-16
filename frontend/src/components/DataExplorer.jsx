 // components/DataExplorer.jsx
import React, { useState } from 'react';
import { Button, HTMLTable, InputGroup, Card, Tabs, Tab, FormGroup, Switch } from '@blueprintjs/core';
import { useQuery } from '@tanstack/react-query';
import useWorkspaceStore from '../stores/workspaceStore';
import './DataExplorer.css';

const DataExplorer = ({ groupMap }) => {
  const { setSelectedNode } = useWorkspaceStore();
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState('groups');
  const [showAdvanced, setShowAdvanced] = useState(false);

  // Query for additional data from API
  const { data: metadata, isLoading } = useQuery({
    queryKey: ['metadata'],
    queryFn: async () => {
      // Simulated API call - replace with actual endpoint
      await new Promise(resolve => setTimeout(resolve, 1000));
      return {
        species: [
          { id: 'ath', name: 'Arabidopsis thaliana', geneCount: 25 },
          { id: 'osa', name: 'Oryza sativa', geneCount: 12 },
          { id: 'zma', name: 'Zea mays', geneCount: 8 },
        ],
        statistics: {
          totalGenes: 45,
          totalGroups: Object.keys(groupMap || {}).length,
          averageGroupSize: 3.2,
        }
      };
    },
    enabled: activeTab === 'stats',
  });

  // Process ortholog groups
  const processedGroups = React.useMemo(() => {
    if (!groupMap) return [];
    
    const groups = {};
    Object.entries(groupMap).forEach(([geneId, groupId]) => {
      if (!groups[groupId]) {
        groups[groupId] = { id: groupId, genes: [] };
      }
      groups[groupId].genes.push(geneId);
    });
    
    return Object.values(groups);
  }, [groupMap]);

  // Filter groups based on search
  const filteredGroups = React.useMemo(() => {
    if (!searchTerm) return processedGroups;
    const lowerSearch = searchTerm.toLowerCase();
    
    return processedGroups.filter(group => 
      group.id.toLowerCase().includes(lowerSearch) || 
      group.genes.some(gene => gene.toLowerCase().includes(lowerSearch))
    );
  }, [processedGroups, searchTerm]);

  // Handler for clicking a gene
  const handleGeneClick = (geneId) => {
    setSelectedNode(geneId);
  };

  return (
    <div className="data-explorer">
      <div className="explorer-header">
        <InputGroup
          leftIcon="search"
          placeholder="Search genes or groups..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="search-input"
        />
        <Button 
          icon={showAdvanced ? "chevron-up" : "chevron-down"} 
          minimal={true}
          onClick={() => setShowAdvanced(!showAdvanced)}
        >
          {showAdvanced ? "Hide Options" : "Show Options"}
        </Button>
      </div>
      
      {showAdvanced && (
        <Card className="advanced-options">
          <FormGroup label="Filter Options">
            <div className="filter-row">
              <Switch label="Show only selected species" />
              <Switch label="Include annotations" />
              <Switch label="Show only connected nodes" />
            </div>
          </FormGroup>
          <FormGroup label="Export Options">
            <div className="button-row">
              <Button small={true} icon="export" text="Export CSV" />
              <Button small={true} icon="document" text="Export JSON" />
              <Button small={true} icon="code-block" text="Export RDF" />
            </div>
          </FormGroup>
        </Card>
      )}

      <Tabs 
        id="explorer-tabs" 
        selectedTabId={activeTab} 
        onChange={setActiveTab}
        className="explorer-tabs"
      >
        <Tab 
          id="groups" 
          title="Ortholog Groups" 
          panel={
            <div className="tab-content">
              <div className="group-stats">
                <span>{filteredGroups.length} groups</span>
                <span>{groupMap ? Object.keys(groupMap).length : 0} genes</span>
              </div>
              
              {filteredGroups.length === 0 ? (
                <div className="empty-state">
                  <p>No ortholog groups found</p>
                  {searchTerm && <p>Try adjusting your search criteria</p>}
                </div>
              ) : (
                <HTMLTable striped={true} className="data-table">
                  <thead>
                    <tr>
                      <th>Group ID</th>
                      <th>Genes</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredGroups.map(group => (
                      <tr key={group.id}>
                        <td>{group.id}</td>
                        <td>
                          <div className="gene-chips">
                            {group.genes.map(gene => (
                              <span 
                                key={gene} 
                                className="gene-chip"
                                onClick={() => handleGeneClick(gene)}
                              >
                                {gene}
                              </span>
                            ))}
                          </div>
                        </td>
                        <td>
                          <Button 
                            small={true} 
                            minimal={true} 
                            icon="eye-open" 
                            title="View in Tree"
                            onClick={() => {
                              // Highlight this group in the tree
                              if (group.genes.length > 0) {
                                handleGeneClick(group.genes[0]);
                              }
                            }}
                          />
                          <Button 
                            small={true} 
                            minimal={true} 
                            icon="graph" 
                            title="View in Graph"
                          />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </HTMLTable>
              )}
            </div>
          } 
        />
        <Tab 
          id="genes" 
          title="Genes" 
          panel={
            <div className="tab-content">
              <HTMLTable striped={true} className="data-table">
                <thead>
                  <tr>
                    <th>Gene ID</th>
                    <th>Group</th>
                    <th>Species</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {groupMap && Object.entries(groupMap)
                    .filter(([geneId]) => !searchTerm || geneId.toLowerCase().includes(searchTerm.toLowerCase()))
                    .map(([geneId, groupId]) => (
                      <tr key={geneId}>
                        <td>{geneId}</td>
                        <td>{groupId}</td>
                        <td>{geneId.startsWith('AT') ? 'A. thaliana' : 
                             geneId.startsWith('OS') ? 'O. sativa' : 
                             geneId.startsWith('GRMZM') ? 'Z. mays' : 'Unknown'}</td>
                        <td>
                          <Button 
                            small={true} 
                            minimal={true} 
                            icon="eye-open" 
                            title="View in Tree"
                            onClick={() => handleGeneClick(geneId)}
                          />
                          <Button 
                            small={true} 
                            minimal={true} 
                            icon="graph" 
                            title="View in Graph"
                            onClick={() => handleGeneClick(geneId)}
                          />
                        </td>
                      </tr>
                    ))}
                </tbody>
              </HTMLTable>
            </div>
          } 
        />
        <Tab 
          id="stats" 
          title="Statistics" 
          panel={
            <div className="tab-content">
              {isLoading ? (
                <div className="loading-state">Loading statistics...</div>
              ) : (
                <div className="statistics-container">
                  <Card className="stat-card">
                    <h3>Overview</h3>
                    <div className="stat-grid">
                      <div className="stat-item">
                        <div className="stat-value">{metadata?.statistics.totalGenes || 0}</div>
                        <div className="stat-label">Total Genes</div>
                      </div>
                      <div className="stat-item">
                        <div className="stat-value">{metadata?.statistics.totalGroups || 0}</div>
                        <div className="stat-label">Ortholog Groups</div>
                      </div>
                      <div className="stat-item">
                        <div className="stat-value">{metadata?.statistics.averageGroupSize || 0}</div>
                        <div className="stat-label">Avg. Group Size</div>
                      </div>
                    </div>
                  </Card>
                  
                  <Card className="stat-card">
                    <h3>Species Distribution</h3>
                    {metadata?.species.map(species => (
                      <div key={species.id} className="species-bar">
                        <div className="species-name">{species.name}</div>
                        <div className="species-bar-container">
                          <div 
                            className="species-bar-fill"
                            style={{ 
                              width: `${(species.geneCount / metadata.statistics.totalGenes) * 100}%`,
                              backgroundColor: species.id === 'ath' ? '#86efac' : 
                                              species.id === 'osa' ? '#a5b4fc' : '#f9a8d4'
                            }}
                          ></div>
                        </div>
                        <div className="species-count">{species.geneCount}</div>
                      </div>
                    ))}
                  </Card>
                </div>
              )}
            </div>
          } 
        />
      </Tabs>
    </div>
  );
};

export default DataExplorer;
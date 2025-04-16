// src/components/NodeDetailsPanel.jsx
import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { FaTimes, FaEye, FaLink, FaProjectDiagram, FaSpinner, FaExclamationTriangle, FaRedo } from 'react-icons/fa';
import './NodeDetailsPanel.css';

const NodeDetailsPanel = ({ node, onClose, embedded = false }) => {
  const [activeTab, setActiveTab] = useState('overview');
  
  // Extract node ID from props
  const nodeId = node?.id || node?.data?.id;

  // Fetch node details
  const { data: nodeDetails, isLoading, error } = useQuery({
    queryKey: ['nodeDetails', nodeId],
    queryFn: async () => {
      if (!nodeId) return null;
      
      // Simulate API call - replace with actual endpoint
      await new Promise(resolve => setTimeout(resolve, 800));
      
      // Mock data based on node ID pattern
      if (nodeId && nodeId.startsWith('AT')) {
        return {
          id: nodeId,
          name: nodeId,
          type: 'gene',
          species: 'Arabidopsis thaliana',
          description: 'Encodes a protein with RNA-binding domains that has similarity to FCA.',
          chromosome: 'Chr1',
          position: '3631-5899',
          strand: '+',
          exons: 10,
          go_terms: [
            { id: 'GO:0003723', name: 'RNA binding' },
            { id: 'GO:0005634', name: 'nucleus' },
            { id: 'GO:0006397', name: 'mRNA processing' }
          ],
          orthologs: [
            { id: 'OS01G00010', species: 'Oryza sativa' },
            { id: 'GRMZM2G174784', species: 'Zea mays' }
          ],
          publications: [
            { pmid: '12837945', title: 'Genome-wide insertional mutagenesis of Arabidopsis thaliana', year: 2003 }
          ]
        };
      } else if (nodeId && nodeId.startsWith('OS')) {
        return {
          id: nodeId,
          name: nodeId,
          type: 'gene',
          species: 'Oryza sativa',
          description: 'Putative RNA-binding protein.',
          chromosome: 'Chr1',
          position: '2500-4200',
          strand: '-',
          exons: 8,
          go_terms: [
            { id: 'GO:0003723', name: 'RNA binding' },
            { id: 'GO:0005634', name: 'nucleus' }
          ],
          orthologs: [
            { id: 'AT1G01010', species: 'Arabidopsis thaliana' }
          ],
          publications: []
        };
      } else if (nodeId && nodeId.startsWith('GRMZM')) {
        return {
          id: nodeId,
          name: nodeId,
          type: 'gene',
          species: 'Zea mays',
          description: 'RNA-binding protein involved in flowering time regulation.',
          chromosome: 'Chr3',
          position: '15200-18500',
          strand: '+',
          exons: 12,
          go_terms: [
            { id: 'GO:0003723', name: 'RNA binding' },
            { id: 'GO:0005634', name: 'nucleus' },
            { id: 'GO:0048510', name: 'regulation of timing of transition from vegetative to reproductive phase' }
          ],
          orthologs: [
            { id: 'AT1G01010', species: 'Arabidopsis thaliana' }
          ],
          publications: [
            { pmid: '25605781', title: 'Genetic analysis of maize RNA-binding proteins', year: 2015 }
          ]
        };
      } else if (nodeId && nodeId.includes('ortho')) {
        return {
          id: nodeId,
          name: 'Ortholog Group',
          type: 'ortholog',
          description: 'RNA-binding protein family involved in flowering time regulation.',
          members: [
            { id: 'AT1G01010', species: 'Arabidopsis thaliana' },
            { id: 'OS01G00010', species: 'Oryza sativa' },
            { id: 'GRMZM2G174784', species: 'Zea mays' }
          ],
          go_enrichment: [
            { id: 'GO:0003723', name: 'RNA binding', pvalue: 0.001 },
            { id: 'GO:0005634', name: 'nucleus', pvalue: 0.005 },
            { id: 'GO:0006397', name: 'mRNA processing', pvalue: 0.01 }
          ]
        };
      }
      
      return {
        id: nodeId,
        name: nodeId,
        type: 'unknown',
        description: 'No detailed information available for this node.'
      };
    },
    enabled: !!nodeId
  });

  // Reset active tab when node changes
  useEffect(() => {
    setActiveTab('overview');
  }, [nodeId]);

  // Render tabs UI for different types of content
  const renderTabs = (tabOptions, activeId, onChange) => {
    return (
      <div className="custom-tabs">
        <div className="tabs-header">
          {tabOptions.map(tab => (
            <button 
              key={tab.id}
              className={`tab-button ${activeId === tab.id ? 'active' : ''}`}
              onClick={() => onChange(tab.id)}
            >
              {tab.title}
            </button>
          ))}
        </div>
      </div>
    );
  };

  // Custom card component
  const Card = ({children, className = ''}) => {
    return (
      <div className={`custom-card ${className}`}>
        {children}
      </div>
    );
  };

  // Custom tag component
  const Tag = ({children, minimal = false, large = false}) => {
    return (
      <span className={`custom-tag ${minimal ? 'minimal' : ''} ${large ? 'large' : ''}`}>
        {children}
      </span>
    );
  };

  // Custom button component
  const Button = ({
    children, 
    icon, 
    text, 
    onClick, 
    small = false,
    minimal = false,
    title
  }) => {
    return (
      <button 
        className={`custom-button ${small ? 'small' : ''} ${minimal ? 'minimal' : ''}`}
        onClick={onClick}
        title={title}
      >
        {icon && <span className="button-icon">{icon}</span>}
        {text && <span className="button-text">{text}</span>}
        {children}
      </button>
    );
  };

  // Custom table component
  const HTMLTable = ({
    children,
    striped = false,
    className = ''
  }) => {
    return (
      <table className={`custom-table ${striped ? 'striped' : ''} ${className}`}>
        {children}
      </table>
    );
  };

  if (!node) {
    return (
      <div className="node-details-empty">
        <div className="empty-message">
          <div className="empty-icon">ⓘ</div>
          <h3>No Node Selected</h3>
          <p>Click on a node in the tree or graph to view its details</p>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="node-details-loading">
        <FaSpinner className="spinner" />
        <div>Loading details for {nodeId}...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="node-details-error">
        <h3>Error Loading Details</h3>
        <p>{error.message}</p>
        <Button 
          icon={<FaRedo />} 
          text="Retry" 
          onClick={() => window.location.reload()} 
        />
      </div>
    );
  }

  if (!nodeDetails) {
    return (
      <div className="node-details-empty">
        <div className="empty-message">
          <div className="empty-icon"><FaExclamationTriangle /></div>
          <h3>No Data Available</h3>
          <p>Could not find details for node: {nodeId}</p>
        </div>
      </div>
    );
  }

  // Render different content based on node type
  const renderContent = () => {
    if (nodeDetails.type === 'ortholog') {
      const orthologDetails = nodeDetails;
      
      const orthologTabs = [
        { id: 'overview', title: 'Overview' },
        { id: 'evolution', title: 'Evolution' },
        { id: 'functions', title: 'Functions' }
      ];

      return (
        <>
          {renderTabs(orthologTabs, activeTab, setActiveTab)}
          
          <div className="tab-panel">
            {activeTab === 'overview' && (
              <div className="tab-content">
                <Card>
                  <h3>{orthologDetails.name}</h3>
                  <p className="description">{orthologDetails.description}</p>
                  
                  <div className="section-title">Members</div>
                  <div className="member-list">
                    {orthologDetails.members.map(member => (
                      <div key={member.id} className="member-item">
                        <Tag minimal>{member.species}</Tag>
                        <a href="#" onClick={(e) => {
                          e.preventDefault();
                          // Handle clicking on a member gene
                          window.highlightNodeInGraph?.(member.id);
                        }}>
                          {member.id}
                        </a>
                      </div>
                    ))}
                  </div>
                </Card>
                
                <Card>
                  <div className="section-title">GO Term Enrichment</div>
                  <HTMLTable striped className="enrichment-table">
                    <thead>
                      <tr>
                        <th>GO Term</th>
                        <th>Description</th>
                        <th>p-value</th>
                      </tr>
                    </thead>
                    <tbody>
                      {orthologDetails.go_enrichment.map(term => (
                        <tr key={term.id}>
                          <td>
                            <a href={`http://amigo.geneontology.org/amigo/term/${term.id}`} target="_blank" rel="noopener noreferrer">
                              {term.id}
                            </a>
                          </td>
                          <td>{term.name}</td>
                          <td>{term.pvalue}</td>
                        </tr>
                      ))}
                    </tbody>
                  </HTMLTable>
                </Card>
              </div>
            )}
            
            {activeTab === 'evolution' && (
              <div className="tab-content">
                <Card>
                  <h3>Evolutionary Analysis</h3>
                  <p>Phylogenetic analysis of this ortholog group across species.</p>
                  
                  <div className="section-title">Conservation Scores</div>
                  <div className="conservation-bars">
                    <div className="conservation-bar-item">
                      <div className="conservation-label">Sequence Identity</div>
                      <div className="conservation-bar-container">
                        <div className="conservation-bar-fill" style={{ width: '75%' }}></div>
                      </div>
                      <div className="conservation-value">75%</div>
                    </div>
                    <div className="conservation-bar-item">
                      <div className="conservation-label">Domain Conservation</div>
                      <div className="conservation-bar-container">
                        <div className="conservation-bar-fill" style={{ width: '92%' }}></div>
                      </div>
                      <div className="conservation-value">92%</div>
                    </div>
                    <div className="conservation-bar-item">
                      <div className="conservation-label">Synteny</div>
                      <div className="conservation-bar-container">
                        <div className="conservation-bar-fill" style={{ width: '68%' }}></div>
                      </div>
                      <div className="conservation-value">68%</div>
                    </div>
                  </div>
                </Card>
              </div>
            )}
            
            {activeTab === 'functions' && (
              <div className="tab-content">
                <Card>
                  <h3>Functional Analysis</h3>
                  <p>Predicted functions and pathways for this ortholog group.</p>
                  
                  <div className="section-title">Predicted Pathways</div>
                  <HTMLTable striped>
                    <thead>
                      <tr>
                        <th>Pathway</th>
                        <th>Source</th>
                        <th>Confidence</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td>mRNA processing</td>
                        <td>KEGG</td>
                        <td>High</td>
                      </tr>
                      <tr>
                        <td>Regulation of flowering time</td>
                        <td>PlantCyc</td>
                        <td>Medium</td>
                      </tr>
                      <tr>
                        <td>Response to cold</td>
                        <td>GO</td>
                        <td>Low</td>
                      </tr>
                    </tbody>
                  </HTMLTable>
                </Card>
              </div>
            )}
          </div>
        </>
      );
    } else if (nodeDetails.type === 'gene') {
      const geneDetails = nodeDetails;
      
      const geneTabs = [
        { id: 'overview', title: 'Overview' },
        { id: 'publications', title: 'Publications' },
        { id: 'expression', title: 'Expression' }
      ];

      return (
        <>
          {renderTabs(geneTabs, activeTab, setActiveTab)}
          
          <div className="tab-panel">
            {activeTab === 'overview' && (
              <div className="tab-content">
                <Card>
                  <div className="gene-header">
                    <h3>{geneDetails.name}</h3>
                    <Tag large>{geneDetails.species}</Tag>
                  </div>
                  <p className="description">{geneDetails.description}</p>
                  
                  <div className="gene-location">
                    <div className="location-item">
                      <div className="location-label">Chromosome</div>
                      <div className="location-value">{geneDetails.chromosome}</div>
                    </div>
                    <div className="location-item">
                      <div className="location-label">Position</div>
                      <div className="location-value">{geneDetails.position}</div>
                    </div>
                    <div className="location-item">
                      <div className="location-label">Strand</div>
                      <div className="location-value">{geneDetails.strand}</div>
                    </div>
                    <div className="location-item">
                      <div className="location-label">Exons</div>
                      <div className="location-value">{geneDetails.exons}</div>
                    </div>
                  </div>
                </Card>
                
                <Card>
                  <div className="section-title">GO Terms</div>
                  <div className="go-terms">
                    {geneDetails.go_terms?.map(term => (
                      <div key={term.id} className="go-term-item">
                        <a href={`http://amigo.geneontology.org/amigo/term/${term.id}`} target="_blank" rel="noopener noreferrer">
                          {term.id}
                        </a>
                        <span className="go-term-name">{term.name}</span>
                      </div>
                    ))}
                  </div>
                </Card>
                
                <Card>
                  <div className="section-title">Orthologs</div>
                  <div className="ortholog-list">
                    {geneDetails.orthologs?.map(ortholog => (
                      <div key={ortholog.id} className="ortholog-item">
                        <Tag minimal>{ortholog.species}</Tag>
                        <a href="#" onClick={(e) => {
                          e.preventDefault();
                          // Handle clicking on an ortholog
                          window.highlightNodeInGraph?.(ortholog.id);
                        }}>
                          {ortholog.id}
                        </a>
                      </div>
                    ))}
                  </div>
                </Card>
              </div>
            )}
            
            {activeTab === 'publications' && (
              <div className="tab-content">
                <Card>
                  <h3>Related Publications</h3>
                  
                  {geneDetails.publications?.length === 0 ? (
                    <div className="empty-publications">
                      <p>No publications found for this gene.</p>
                    </div>
                  ) : (
                    <div className="publication-list">
                      {geneDetails.publications?.map(pub => (
                        <div key={pub.pmid} className="publication-item">
                          <div className="publication-title">
                            <a href={`https://pubmed.ncbi.nlm.nih.gov/${pub.pmid}/`} target="_blank" rel="noopener noreferrer">
                              {pub.title}
                            </a>
                          </div>
                          <div className="publication-meta">
                            <span className="publication-year">{pub.year}</span>
                            <span className="publication-pmid">PMID: {pub.pmid}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </Card>
              </div>
            )}
            
            {activeTab === 'expression' && (
              <div className="tab-content">
                <Card>
                  <h3>Expression Profile</h3>
                  <p>Expression data across tissues and conditions.</p>
                  
                  <div className="expression-placeholder">
                    <div className="placeholder-message">
                      <p>Expression data visualization would appear here.</p>
                      <p>This is a placeholder for integration with expression databases.</p>
                    </div>
                    
                    <Button 
                      icon={<FaProjectDiagram />} 
                      text="Load Expression Data" 
                    />
                  </div>
                </Card>
              </div>
            )}
          </div>
        </>
      );
    } else {
      // Default view for other node types
      return (
        <div className="tab-content">
          <Card>
            <h3>{nodeDetails.name || nodeDetails.id}</h3>
            <p className="description">{nodeDetails.description || "No description available for this node type."}</p>
            
            <div className="node-metadata">
              <div className="metadata-item">
                <div className="metadata-label">ID</div>
                <div className="metadata-value">{nodeDetails.id}</div>
              </div>
              <div className="metadata-item">
                <div className="metadata-label">Type</div>
                <div className="metadata-value">{nodeDetails.type || "unknown"}</div>
              </div>
            </div>
          </Card>
        </div>
      );
    }
  };

  return (
    <div className={`node-details-panel ${embedded ? 'embedded' : ''}`}>
      <div className="details-header">
        <div className="node-id">{nodeId}</div>
        <div className="action-buttons">
          <Button 
            small={true} 
            minimal={true} 
            icon={<FaEye />} 
            title="Highlight in Tree" 
            onClick={() => window.treeRef?.highlightNode(nodeId)} 
          />
          <Button 
            small={true} 
            minimal={true} 
            icon={<FaProjectDiagram />} 
            title="Highlight in Graph"
            onClick={() => window.highlightNodeInGraph?.(nodeId)} 
          />
          <Button 
            small={true} 
            minimal={true} 
            icon={<FaLink />} 
            title="External Reference" 
            onClick={() => window.open(`https://www.ncbi.nlm.nih.gov/gene/?term=${nodeId}`, '_blank')} 
          />
          <Button 
            small={true} 
            minimal={true} 
            icon={<FaTimes />} 
            title="Close Panel" 
            onClick={onClose} 
          />
        </div>
      </div>
      {renderContent()}
    </div>
  );
};

export default NodeDetailsPanel;
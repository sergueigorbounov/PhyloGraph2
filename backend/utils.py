from rdflib import Graph, URIRef, Literal
from rdflib.namespace import RDF
import os

# Basic RDFLib local SPARQL query (reads from Turtle fallback file)
def run_sparql_query(query: str):
    g = Graph()
    if not os.path.exists("demo_graph.ttl"):
        raise FileNotFoundError("demo_graph.ttl not found")
    g.parse("demo_graph.ttl", format="turtle")
    return g.query(query)

# Converts SPARQL SELECT results to basic PhyloXML format
def convert_to_phyloxml(results) -> str:
    root = """
    <phyloxml>
      <phylogeny rooted="true">
        <clade>
          <name>DemoRoot</name>
    """
    for row in results:
        gene = row.get("gene")
        label = row.get("label")
        species = row.get("species")

        gene_name = str(label or gene).split("/")[-1]
        species_name = str(species or "Unknown")

        root += f"""
          <clade>
            <name>{gene_name}</name>
            <taxonomy><scientific_name>{species_name}</scientific_name></taxonomy>
          </clade>
        """

    root += """
        </clade>
      </phylogeny>
    </phyloxml>
    """
    return root.strip()

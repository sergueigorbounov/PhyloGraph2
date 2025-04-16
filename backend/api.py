
# ============================================
#  PhyloGraph RDF Backend (FastAPI)
#  Scientific RDF + Ontology + BrAPI Support
#   Project: BReIF & AgroDiv @ INRAE
# ============================================

from fastapi import FastAPI, Request, UploadFile, File, HTTPException, APIRouter, Query
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import Response, JSONResponse
from pydantic import BaseModel
from rdflib import Graph, URIRef, Literal, Namespace, RDF
from rdflib.plugins.stores.sparqlstore import SPARQLStore
from typing import List
from elasticsearch import Elasticsearch
from py2neo import Graph as Neo4jGraph, Node, Relationship
from urllib.parse import urlparse
from sparql_templates import ortholog_tree_query
from utils import run_sparql_query, convert_to_phyloxml

import pandas as pd
import requests
import os

# === Init App ===
app = FastAPI()
router = APIRouter()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], allow_credentials=True,
    allow_methods=["*"], allow_headers=["*"]
)

# === RDF Setup ===
EX = Namespace("http://example.org/")
g = Graph()

# === FAIDARE BrAPI Base ===
FAIDARE_BASE = "https://urgi.versailles.inrae.fr/faidare/brapi/v1"

# === Models ===
class TraitLink(BaseModel):
    gene_id: str
    gene_label: str
    trait_label: str
    trait_uri: str
    species: str

class TreeTriple(BaseModel):
    gene_id: str
    species: str
    group_id: str

class TraitQuery(BaseModel):
    query: str

# === Utils ===
def is_uri(val):
    return urlparse(val).scheme in ['http', 'https']

def export_to_neo4j():
    neo4j = Neo4jGraph("bolt://localhost:7687", auth=("neo4j", "password"))
    for s, p, o in g:
        subj = Node("Entity", uri=str(s))
        obj = Node("Entity", uri=str(o))
        rel = Relationship(subj, str(p), obj)
        neo4j.merge(subj); neo4j.merge(obj); neo4j.merge(rel)

def export_to_elasticsearch():
    es = Elasticsearch("http://localhost:9200")
    for s, p, o in g:
        es.index(index="phylograph", document={"subject": str(s), "predicate": str(p), "object": str(o)})

# === API Routes ===

@app.post("/graph")
def receive_graph(data: List[TraitLink]):
    for item in data:
        gene = URIRef(item.gene_id) if is_uri(item.gene_id) else URIRef(f"{EX}{item.gene_id}")
        trait = URIRef(item.trait_uri)
        g.add((gene, RDF.type, EX.Gene))
        g.add((gene, EX.associatedWith, trait))
        g.add((gene, EX.species, Literal(item.species)))
        g.add((gene, EX.label, Literal(item.gene_label)))
    return {"message": "Graph data received."}

@app.post("/graph/tree")
def add_tree_triples(data: List[TreeTriple]):
    for item in data:
        gene = URIRef(f"{EX}{item.gene_id}")
        g.add((gene, URIRef("http://example.org/ortholog/memberOf"), Literal(item.group_id)))
        g.add((gene, URIRef("http://example.org/ortholog/species"), Literal(item.species)))
        g.add((gene, URIRef("http://example.org/ortholog/label"), Literal(item.gene_id)))
    return {"message": f"{len(data)} ortholog triples added."}

@app.post("/brapi/to-graph")
def add_brapi_to_graph(data: List[TraitLink]):
    for item in data:
        uri = URIRef(f"{EX}{item.gene_id}")
        g.add((uri, RDF.type, EX.Germplasm))
        g.add((uri, EX.label, Literal(item.gene_label)))
        g.add((uri, EX.species, Literal(item.species)))
        g.add((uri, EX.associatedWith, URIRef(item.trait_uri)))
    return {"message": f"{len(data)} germplasm entries added."}

@app.get("/rdf")
def export_rdf():
    try:
        return Response(content=g.serialize(format="turtle"), media_type="text/turtle")
    except Exception as e:
        return Response(f"RDF export failed: {e}", media_type="text/plain", status_code=500)

@app.post("/rdf/clear")
def clear_graph():
    g.remove((None, None, None))
    return {"message": "Graph cleared."}

@app.post("/rdf/upload")
async def upload_rdf(file: UploadFile = File(...)):
    g.parse(data=(await file.read()).decode(), format="turtle")
    return {"message": "RDF uploaded."}

@app.post("/owl/upload")
async def upload_owl(file: UploadFile = File(...)):
    g.parse(data=(await file.read()).decode(), format="xml")
    return {"message": "OWL loaded."}

@app.post("/rdf/to-neo4j")
def push_rdf_to_neo4j():
    try:
        export_to_neo4j()
        return {"message": "RDF → Neo4j done."}
    except Exception as e:
        return {"error": str(e)}

@app.post("/rdf/to-elasticsearch")
def push_rdf_to_elasticsearch():
    try:
        export_to_elasticsearch()
        return {"message": "RDF → Elastic done."}
    except Exception as e:
        return {"error": str(e)}

@app.post("/sparql")
def sparql_query(query: TraitQuery):
    try:
        results = g.query(query.query)
        bindings = []
        for row in results:
            b = {}
            for var in results.vars:
                val = row[var]
                b[str(var)] = {"type": "uri" if isinstance(val, URIRef) else "literal", "value": str(val)}
            bindings.append(b)
        return { "head": {"vars": results.vars}, "results": { "bindings": bindings } }
    except Exception as e:
        return JSONResponse(status_code=422, content={"error": str(e)})

@app.post("/sparql/federated")
async def sparql_federated(request: Request):
    try:
        body = await request.json()
        query = body.get("query")
        endpoint = body.get("endpoint")
        headers = {
            "Accept": "application/sparql-results+json" if "select" in query.lower() else "application/rdf+xml",
            "Content-Type": "application/sparql-query"
        }
        response = requests.post(endpoint, data=query.encode('utf-8'), headers=headers)
        response.raise_for_status()
        return Response(content=response.content, media_type=response.headers.get("Content-Type"))
    except Exception as e:
        return JSONResponse(status_code=500, content={"error": str(e)})

@app.get("/groups")
def get_ortholog_groups():
    try:
        q = "PREFIX orth: <http://example.org/ortholog/> SELECT DISTINCT ?group WHERE { ?s orth:memberOf ?group . }"
        results = g.query(q)
        groups = sorted({str(row.group) for row in results})
        return {"groups": groups or ["DemoOrtholog1"]}
    except Exception as e:
        return {"groups": ["DemoOrtholog1"]}

@app.get("/tree/from-graph")
def get_tree_from_graph():
    tree = {"name": "GraphOrthologs", "children": []}
    groups = {}
    for s, _, o in g.triples((None, URIRef("http://example.org/ortholog/memberOf"), None)):
        group_id = str(o)
        label = g.value(s, URIRef("http://example.org/ortholog/label"), default=s)
        species = g.value(s, URIRef("http://example.org/ortholog/species"), default="Unknown")
        entry = {"name": str(label), "species": str(species)}
        groups.setdefault(group_id, {"name": group_id, "children": []})["children"].append(entry)
    tree["children"] = list(groups.values())
    return tree

@app.get("/export/phyloxml")
def export_phyloxml(group_id: str = Query(...)):
    try:
        query = ortholog_tree_query(group_id)
        results = run_sparql_query(query).bindings
        if not results:
            raise ValueError("Empty SPARQL result")
        tree = convert_to_phyloxml(results)
        return Response(content=tree, media_type="application/xml")
    except Exception as e:
        fallback = """<phyloxml><phylogeny rooted='true'><clade>
        <name>FallbackGene1</name><taxonomy><scientific_name>Arabidopsis thaliana</scientific_name></taxonomy>
        <clade><name>FallbackGene2</name><taxonomy><scientific_name>Oryza sativa</scientific_name></taxonomy></clade>
        </clade></phylogeny></phyloxml>"""
        return Response(content=fallback, media_type="application/xml")

@app.on_event("startup")
def init_demo_graph():
    if os.path.exists("autosave_graph.ttl"):
        g.parse("autosave_graph.ttl", format="turtle")
    else:
        receive_graph([TraitLink(
            gene_id="AT1G01010", gene_label="Gene1", trait_label="Drought tolerance",
            trait_uri="http://purl.obolibrary.org/obo/TO_0006001", species="Arabidopsis thaliana"
        )])
        g.add((URIRef("http://example.org/AT1G01010"), URIRef("http://example.org/ortholog/memberOf"), Literal("DemoOrtholog1")))

@app.on_event("shutdown")
def save_graph():
    g.serialize("autosave_graph.ttl", format="turtle")

app.include_router(router)
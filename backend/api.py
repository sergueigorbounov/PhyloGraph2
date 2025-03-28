from fastapi import FastAPI, Request, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import Response
from pydantic import BaseModel
from rdflib import Graph, URIRef, Literal, Namespace, RDF
from rdflib.plugins.stores.sparqlstore import SPARQLStore
from typing import List
from elasticsearch import Elasticsearch
from py2neo import Graph as Neo4jGraph, Node, Relationship
from urllib.parse import urlparse
import pandas as pd
import requests

app = FastAPI()
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# RDF namespace & in-memory graph
EX = Namespace("http://example.org/")
g = Graph()

# Pydantic Models
class TraitLink(BaseModel):
    gene_id: str
    gene_label: str
    trait_label: str
    trait_uri: str
    species: str

class TraitQuery(BaseModel):
    query: str

# Neo4j & ElasticSearch Pushers
def export_to_neo4j():
    neo4j = Neo4jGraph("bolt://localhost:7687", auth=("neo4j", "password"))
    for s, p, o in g:
        subj = Node("Entity", uri=str(s))
        obj = Node("Entity", uri=str(o))
        rel = Relationship(subj, str(p), obj)
        neo4j.merge(subj)
        neo4j.merge(obj)
        neo4j.merge(rel)

def export_to_elasticsearch():
    es = Elasticsearch("http://localhost:9200")
    for s, p, o in g:
        es.index(index="phylograph", document={"subject": str(s), "predicate": str(p), "object": str(o)})

def is_uri(val):
    return urlparse(val).scheme in ['http', 'https']

# Endpoints
@app.post("/graph")
def receive_graph(data: List[TraitLink]):
    for item in data:
        gene = URIRef(item.gene_id) if is_uri(item.gene_id) else URIRef(f"{EX}{item.gene_id}")
        trait = URIRef(item.trait_uri)
        g.add((gene, RDF.type, EX.Gene))
        g.add((gene, EX.associatedWith, trait))
        g.add((gene, EX.species, Literal(item.species)))
        g.add((gene, EX.label, Literal(item.gene_label)))
    return {"message": "Graph data received and added."}

@app.get("/rdf")
def export_rdf():
    try:
        return Response(content=g.serialize(format="turtle"), media_type="text/turtle")
    except Exception as e:
        print("Serialization error:", e)
        for s, p, o in g:
            print("Stopped", s, p, o)
        return Response(f"RDF export failed: {e}", media_type="text/plain", status_code=500)

@app.post("/rdf/clear")
def clear_graph():
    g.remove((None, None, None))
    return {"message": "RDF graph cleared."}

@app.post("/rdf/upload")
async def upload_rdf(file: UploadFile = File(...)):
    try:
        data = await file.read()
        g.parse(data=data.decode(), format="turtle")
        return {"message": "RDF parsed and injected into graph"}
    except Exception as e:
        return {"error": str(e)}

@app.post("/rdf/to-neo4j")
def push_rdf_to_neo4j():
    try:
        export_to_neo4j()
        return {"message": "Triples pushed to Neo4j"}
    except Exception as e:
        return {"error": str(e)}

@app.post("/rdf/to-elasticsearch")
def push_rdf_to_elasticsearch():
    try:
        export_to_elasticsearch()
        return {"message": "Triples pushed to ElasticSearch"}
    except Exception as e:
        return {"error": str(e)}

@app.post("/sparql")
async def run_sparql(request: Request):
    try:
        results = g.query((await request.json()).get("query"))
        return "\n".join([" | ".join(map(str, row)) for row in results])
    except Exception as e:
        return {"error": str(e)}

@app.post("/sparql/federated")
async def federated_sparql(request: Request):
    body = await request.json()
    endpoint = body.get("endpoint")
    query = body.get("query")
    if not endpoint or not query:
        return {"error": "Missing endpoint or query"}
    try:
        headers = {"Accept": "application/sparql-results+json"}
        if "wikidata.org" in endpoint:
            response = requests.get(endpoint, params={"query": query}, headers=headers)
        elif "inrae.fr" in endpoint or "urgi" in endpoint:
            response = requests.get(endpoint, params={"query": query}, headers=headers)
        else:
            headers["Content-Type"] = "application/sparql-query"
            response = requests.post(endpoint, data=query, headers=headers)

        response.raise_for_status()
        return response.json()
    except Exception as e:
        return {"error": str(e)}

@app.post("/csv-to-rdf")
async def csv_to_rdf(file: UploadFile = File(...)):
    try:
        df = pd.read_csv(file.file)
        g_csv = Graph()
        g_csv.bind("ex", EX)
        for _, row in df.iterrows():
            gene_uri = URIRef(f"{EX}{row['gene_id']}")
            g_csv.add((gene_uri, RDF.type, EX.Gene))
            g_csv.add((gene_uri, EX.label, Literal(row['gene_label'])))
            g_csv.add((gene_uri, EX.associatedWith, URIRef(row['trait_uri'])))
            g_csv.add((gene_uri, EX.species, Literal(row['species'])))
        return Response(content=g_csv.serialize(format="turtle"), media_type="text/turtle")
    except Exception as e:
        return {"error": f"CSV to RDF conversion failed: {str(e)}"}

@app.post("/validate_trait")
def validate_trait(label: str):
    return {"label": label, "uri": "http://purl.obolibrary.org/obo/TO_0006001"}

@app.post("/ask")
def ask_llm(query: TraitQuery):
    return {"parsed_query": f"SELECT genes related to '{query.query}'"}

@app.on_event("startup")
def init_demo_graph():
    receive_graph([TraitLink(
        gene_id="AT1G01010",
        gene_label="Gene1",
        trait_label="Drought tolerance",
        trait_uri="http://purl.obolibrary.org/obo/TO_0006001",
        species="Arabidopsis thaliana"
    )])

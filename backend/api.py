from fastapi import FastAPI, Request, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import Response, JSONResponse
from pydantic import BaseModel
from rdflib import Graph, URIRef, Literal, Namespace, RDF
from rdflib.plugins.stores.sparqlstore import SPARQLStore
from rdflib.plugins.sparql.results.jsonresults import JSONResultSerializer
from typing import List
from elasticsearch import Elasticsearch
from py2neo import Graph as Neo4jGraph, Node, Relationship
from urllib.parse import urlparse
from io import BytesIO
from io import BytesIO, StringIO  
from fastapi.responses import JSONResponse
from fastapi import APIRouter, Request
import requests
import pandas as pd
import requests
import requests
from fastapi.responses import JSONResponse
from fastapi import APIRouter, Request
from fastapi.responses import JSONResponse
from fastapi import FastAPI, HTTPException
import requests
import requests

router = APIRouter()
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
router = APIRouter()

FAIDARE_BASE = "https://urgi.versailles.inrae.fr/faidare/brapi/v1"

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

@app.post("/owl/upload")
async def upload_owl(file: UploadFile = File(...)):
    data = await file.read()
    g.parse(data=data.decode(), format="xml")  # OWL = RDF/XML
    return {"message": "OWL ontology loaded"}

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

from fastapi.responses import JSONResponse

@app.post("/sparql")
def sparql_query(query: TraitQuery):
    # TEMP FIX: Return a dummy result
    return JSONResponse(content={
        "head": { "vars": ["s", "p", "o"] },
        "results": {
            "bindings": [
                { "s": {"type": "uri", "value": "http://example.org/Gene1" },
                  "p": {"type": "uri", "value": "http://example.org/associatedWith" },
                  "o": {"type": "literal", "value": "Drought tolerance" }
                }
            ]
        }
    })

@app.post("/sparql/federated")
async def federated_sparql(query: dict):
    try:
        response = requests.post(
            query["endpoint"],
            data=query["query"],
            headers={
                "Accept": "application/sparql-results+json",
                "Content-Type": "application/sparql-query"
            },
            timeout=10
        )
        response.raise_for_status()
        return response.json()
    except requests.exceptions.RequestException as e:
        print(f"Federated query failed: {e}")
        raise HTTPException(status_code=500, detail=f"Federated SPARQL failed: {str(e)}")

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

@router.get("/brapi/germplasm")
def get_germplasm(q: str):
    try:
        r = requests.get(f"{FAIDARE_BASE}/germplasm", params={"q": q})
        r.raise_for_status()
        return r.json()
    except Exception as e:
        return {"error": str(e)}

@router.post("/brapi/germplasm/search")
def search_germplasm(payload: dict):
    try:
        r = requests.post(f"{FAIDARE_BASE}/germplasm/search", json=payload)
        r.raise_for_status()
        return r.json()
    except Exception as e:
        return {"error": str(e)}

@app.post("/export/rdf-to-owl")
def convert_rdf_to_owl(file: UploadFile = File(...)):
    g = Graph()
    g.parse(file.file, format="turtle")
    owl_output = g.serialize(format="xml")  # RDF/XML is OWL-compatible
    return Response(content=owl_output, media_type="application/rdf+xml")

@app.get("/brapi/germplasm")
def proxy_brapi_germplasm(q: str = ""):
    try:
        url = f"https://urgi.versailles.inrae.fr/faidare/brapi/v1/germplasm-search"
        payload = {
            "germplasmName": q,
            "commonCropName": q,
            "synonyms": q,
            "accessionNumber": q,
            "pageSize": 20
        }
        r = requests.post(url, json=payload, timeout=10)
        r.raise_for_status()
        return r.json()
    except Exception as e:
        print("BrAPI proxy failed:", e)
        return JSONResponse(content={"error": str(e)}, status_code=500)

@router.get("/brapi/germplasm")
async def get_brapi_germplasm(request: Request):
    q = request.query_params.get("q")
    filter_type = request.query_params.get("filter", "name")
    species = request.query_params.get("species", "wheat").lower()

    if not q:
        return JSONResponse({"error": "Missing query"}, status_code=400)

    # 🔎 Basic BrAPI filter mapping (adjust for real FAIDARE API)
    filter_map = {
        "name": "germplasmName",
        "accessionNumber": "accessionNumber",
        "synonym": "synonym"
    }

    brapi_filter = filter_map.get(filter_type, "germplasmName")

    # 🔁 Adjust species-specific endpoint if needed (e.g., future federation)
    # Example assumes FAIDARE supports cross-species search
    url = f"https://urgi.versailles.inrae.fr/faidare/brapi/v2/germplasm?{brapi_filter}={q}"

    # Optional: Add crop name as filter (if FAIDARE supports it in the future)
    # url += f"&commonCropName={species}"

    try:
        res = requests.get(url, timeout=10)
        res.raise_for_status()
        data = res.json()

        # Optionally filter on species client-side
        if species:
            filtered = [
                g for g in data.get("result", {}).get("data", [])
                if g.get("commonCropName", "").lower() == species
            ]
            data["result"]["data"] = filtered

        return data

    except Exception as e:
        return JSONResponse({"error": str(e)}, status_code=500)

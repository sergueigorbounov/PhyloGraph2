from rdflib.plugins.sparql.processor import prepareQuery
from fastapi.middleware.cors import CORSMiddleware
from fastapi import FastAPI
from fastapi import FastAPI, Request
from pydantic import BaseModel
from rdflib import Graph, URIRef, Literal, Namespace, RDF
from typing import List
import uuid



app = FastAPI()
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # or specify ["http://localhost:5174"]
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- RDF Setup ---
EX = Namespace("http://example.org/")
TO = Namespace("http://purl.obolibrary.org/obo/TO_")
g = Graph()

# --- Models ---
class TraitLink(BaseModel):
    gene_id: str
    gene_label: str
    trait_label: str
    trait_uri: str
    species: str

class TraitQuery(BaseModel):
    query: str

# --- Endpoints ---

@app.post("/graph")
def receive_graph(data: List[TraitLink]):
    for item in data:
        gene = URIRef(f"{EX}{item.gene_id}")
        trait = URIRef(item.trait_uri)
        g.add((gene, RDF.type, EX.Gene))
        g.add((gene, EX.associatedWith, trait))
        g.add((gene, EX.species, Literal(item.species)))
        g.add((gene, EX.label, Literal(item.gene_label)))
    return {"message": "Graph data received and added."}

@app.get("/rdf")
def export_rdf():
    ttl = g.serialize(format="turtle")
    return ttl

@app.post("/validate_trait")
def validate_trait(label: str):
    # Placeholder: In real app, validate against AgroPortal or local TO
    # Here, just return a mocked URI for demo purposes
    uri = f"http://purl.obolibrary.org/obo/TO_0006001"
    return {"label": label, "uri": uri}

@app.post("/ask")
def ask_llm(query: TraitQuery):
    # Placeholder for LLM handling
    return {"parsed_query": f"SELECT genes related to '{query.query}'"}

@app.post("/sparql")
async def run_sparql(request: Request):
    body = await request.json()
    q = body.get("query")
    try:
        results = g.query(q)
        output = []
        for row in results:
            output.append(" | ".join(map(str, row)))
        return "\n".join(output)
    except Exception as e:
        return {"error": str(e)}

@app.on_event("startup")
def load_demo_graph():
    demo = TraitLink(
        gene_id="AT1G01010",
        gene_label="Gene1",
        trait_label="Drought tolerance",
        trait_uri="http://purl.obolibrary.org/obo/TO_0006001",
        species="Arabidopsis thaliana"
    )
    receive_graph([demo])

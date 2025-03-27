# # ![PhyloGraph.png](frontend/public/PhyloGraph.png)PhyloGraph

## FAIR Semantic Gene-Trait Graph Explorer for Translational Plant Genomics

**Projects**: BReIF & AgroDiv (PEPR Agroécologie et Numérique)  
**Institutions**: URGI & CNRGV, INRAE

![PhyloGraph Logo](./frontend/public/PhyloGraph.png)

---

## Objective

Enable scientists to dynamically explore and visualize semantic links between genes and traits in plants, using RDF graphs and ontology-based standards.

> "Visualiser les relations complexes entre gènes et traits pour une génomique végétale interopérable, FAIR, et ouverte."

---

## Quick Summary

- Built with **React**, **FastAPI**, **Cytoscape.js**, **RDFLib**
- Exports graphs in RDF/Turtle
- Integrates SPARQL querying & LLM/NLQ
- Interoperable with **SyntenyViewer**, **FAIDARE**, **Neo4j**
- Visual, intuitive, FAIR-compliant

---

## Interoperability

| Platform         | Usage                            |
|------------------|----------------------------------|
| **SyntenyViewer** | Gène ➔ Synténie ➔ Traits         |
| **FAIDARE**       | Germplasm / phenotype federation |
| **AgroPortal**    | TO Ontology term validation      |
| **Neo4j**         | GraphDB integration (planned)    |

---

## 🤖 Key Features

- Gene ID ➔ Trait ➔ Ontology exploration
- SPARQL builder + natural language querying
- RDF export, injection, CSV-to-RDF
- Responsive UI + Tailwind
- Right-side panels for LLM / CSV / SPARQL / NLQ / Conversion

---

## Technologies

| Frontend       | Backend           | Semantic Web         | Graph & AI        |
|----------------|--------------------|------------------------|--------------------|
| React, Vite    | FastAPI, Python    | RDFLib, SPARQLWrapper | Cytoscape.js, LLM |
| TailwindCSS    | Uvicorn            | TO, JSON-LD           | Neo4j (planned)   |

---

## Project Status

Current version: **v0.3.0**  
Focus: **Conversion tools + backend RDF injection + SPARQL UX**

Next:  
- Neo4j + Elasticsearch
- Federated SPARQL (FAIDARE)
- RDF Diff & SHACL validation

---

##  Contact / Supervision

**Raphaël FLORES** — URGI / CNRGV / INRAE   
**Sergueï Gorbounov** — URGI / CNRGV / INRAE  
GitHub: [github.com/your-org/PhyloGraph](https://github.com/your-org/PhyloGraph)

---

##  Citation

```bibtex
@misc{phylograph2025,
  title={PhyloGraph: FAIR Semantic Gene-Trait Explorer for Translational Plant Genomics},
  author={Flores, Raphaël and Gorbounov, Sergueï},
  institution={INRAE, URGI & CNRGV},
  year={2025},
  url={https://github.com/your-org/PhyloGraph}
}
```

---

**FAIR, Semantic, Modular, Scientific**
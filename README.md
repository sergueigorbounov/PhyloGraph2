# PhyloGraph – Visualisation interactive de gènes, traits et graphes RDF  
### Graph-based viewer for gene-to-trait relationships with RDF & semantic web interoperability

---

##  Présentation

**PhyloGraph** est une application web interactive développée dans le cadre des projets **BReIF** et **AgroDiv** (PEPR Agroécologie et Numérique), destinée à l’intégration, l’exploration et la visualisation de relations biologiques complexes (gènes, traits, ontologies) via des graphes RDF et des APIs sémantiques.

Elle permet aux chercheurs :

- De visualiser dynamiquement les associations gène-trait
- D’exporter les graphes au format RDF (Turtle)
- D’interroger les données via un langage naturel (avec LLM)
- De favoriser l'interopérabilité avec des bases telles que **SyntenyViewer**, **FAIDARE**, **AgroPortal** ou **Neo4j**

---

##  Overview

**PhyloGraph** is a cutting-edge bioinformatics web interface, built to support INRAE’s needs in genomic data federation and semantic exploration. Developed under the **BReIF** and **AgroDiv** projects (PEPR Agroecology & Digital), it empowers researchers to:

- Dynamically explore gene-to-trait semantic links
- Export graph structures as RDF (Turtle)
- Validate trait ontologies (TO)
- Support integration with LLM/NLP modules for natural language querying
- Interact with graph DBs like **Neo4j**, **FAIDARE**, **AgroBRC**, and **SyntenyViewer**

---

##  Stack technique / Tech stack

| Frontend         | Backend            | Sémantique / Données       | Visualisation  |
|------------------|--------------------|----------------------------|----------------|
| React + Vite     | FastAPI (Python)   | RDFLib, SPARQLWrapper      | Cytoscape.js   |
| Axios            | Uvicorn            | TO Ontology (AgroPortal)   |                |
| HTML/CSS         | pydantic           | Neo4j (planned)            |                |

---

##  Fonctionnalités clés / Core Features

| Endpoint            |          Fonction / Function             |
|---------------------|------------------------------------------|
| `/graph`            | Reçoit et intègre des liens gène → trait |
| `/rdf`              | Exporte le graphe RDF au format Turtle   |
| `/validate_trait`   | Valide un terme TO depuis un label       |
| `/ask`              | Interprète une requête langage naturel   |

---

##  Exemple d’appel API / API Sample

POST http://localhost:8000/graph
Content-Type: application/json

[
  {
    "gene_id": "AT1G01010",
    "gene_label": "Gene1",
    "trait_label": "Drought tolerance",
    "trait_uri": "http://purl.obolibrary.org/obo/TO_0006001",
    "species": "Arabidopsis thaliana"
  }
]

---

##  Objectifs scientifiques / Scientific Goals

Améliorer l'accessibilité aux données génomiques

Favoriser l’interopérabilité entre plateformes INRAE

Permettre la fédération sémantique FAIR des ressources biologiques

Soutenir la visualisation pour les programmes SyntenyViewer, RARe, FAIDARE, ELIXIR-FR

## Ce projet a été conçu pour maximiser l’impact scientifique, la clarté sémantique et la valeur ajoutée pour les chercheurs travaillant sur la génomique végétale et l’agroécologie numérique.

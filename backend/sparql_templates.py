def ortholog_tree_query(group_id: str) -> str:
    return f"""
    PREFIX orth: <http://example.org/ortholog/>

    SELECT ?gene ?species ?label WHERE {{
        ?gene orth:memberOf "{group_id}" ;
              orth:species ?species ;
              orth:label ?label .
    }}
    """

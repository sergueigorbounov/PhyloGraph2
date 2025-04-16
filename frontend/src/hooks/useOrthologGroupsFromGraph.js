import { useEffect, useState } from 'react';

export function useOrthologGroupsFromGraph() {
  const [groupMap, setGroupMap] = useState({});
  const [fallbackUsed, setFallbackUsed] = useState(false);
  const FALLBACK_GROUP = 'http://example.org/group/DemoOrtholog1';

  useEffect(() => {
    const runQuery = async () => {
      const cy = window?.cy;
      if (!cy || cy.nodes().empty()) return;

      const geneNodes = cy.nodes().filter(n => n.data('type') === 'Gene');
      if (geneNodes.length === 0) return;

      const uris = geneNodes
        .map(n => n.data('uri'))
        .filter(uri => uri && uri.startsWith('http') && !uri.includes('GraphOrthologs')) // exclude placeholder URIs
        .map(uri => `<${uri}>`)
        .join(' ');

      if (!uris || uris.length < 5) {
        console.warn('[useOrthologGroupsFromGraph] Skipped: No valid URIs');
        return;
      }

      const query = `
        SELECT ?gene ?group WHERE {
          VALUES ?gene { ${uris} }
          ?gene <http://example.org/memberOf> ?group .
        }
      `.trim();

      console.log('[useOrthologGroupsFromGraph] SPARQL query:', query);

      try {
        const res = await fetch('/sparql', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ query })
        });

        if (!res.ok) throw new Error(`SPARQL error ${res.status}`);
        const json = await res.json();

        const bindings = json?.results?.bindings || [];
        if (bindings.length === 0) throw new Error('No SPARQL results');

        const map = {};
        for (const b of bindings) {
          const geneUri = b?.gene?.value;
          const groupUri = b?.group?.value;
          if (geneUri && groupUri) {
            const id = geneUri.split('/').pop();
            map[id] = groupUri;
          }
        }

        if (Object.keys(map).length === 0) throw new Error('Empty group map');

        setGroupMap(map);
        setFallbackUsed(false);
      } catch (err) {
        console.warn('[useOrthologGroupsFromGraph] ❗Fallback triggered:', err);
        const fallback = {};
        geneNodes.forEach(n => fallback[n.id()] = FALLBACK_GROUP);
        setGroupMap(fallback);
        setFallbackUsed(true);
      }
    };

    runQuery();
  }, []);

  return { groupMap, fallbackUsed };
}
/**
 * @file exportToNewick.js
 * @description Converts a tree object to Newick format for phylogenetic tools.
 */
export function exportToNewick(node) {
    if (!node.children || node.children.length === 0) {
      return node.name;
    }
    const children = node.children.map(exportToNewick).join(',');
    return `(${children})${node.name}`;
  }
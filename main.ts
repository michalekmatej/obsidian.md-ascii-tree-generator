import { Plugin } from 'obsidian';

export default class TreePlugin extends Plugin {
  async onload() {
    this.registerMarkdownCodeBlockProcessor('tree', this.treeProcessor);
  }

  private treeProcessor = (source: string, el: HTMLElement) => {
    const lines = source.split('\n');

    // Determine the common base indent across all non‑empty lines.
    let minIndent = Infinity;
    for (const line of lines) {
      if (line.trim() !== '') {
        const match = line.match(/^([\t ]*)/);
        if (match && match[1].length < minIndent) {
          minIndent = match[1].length;
        }
      }
    }
    let commonIndent = '';
    if (minIndent !== Infinity && minIndent > 0) {
      // Use the indent from the first non‑empty line.
      commonIndent = lines.find(line => line.trim() !== '')?.slice(0, minIndent) || '';
    }

    // Remove the common base indent from each line.
    const adjustedLines = lines.map(line => {
      return line.startsWith(commonIndent) ? line.slice(commonIndent.length) : line;
    });

    // Process each line into nodes according to the input methods.
    const nodes = adjustedLines.map(line => {
      // Try matching markdown list syntax that supports unordered ("-", "*", "+")
      // or ordered lists (e.g., "1. level one").
      const listMatch = line.match(/^([\t ]*)((?:[-*+])|\d+\.)\s+(.*)$/);
      if (listMatch) {
        const rawIndent = listMatch[1];
        // Count indentation: each tab counts as one level; every 4 spaces count as one level.
        const tabCount = (rawIndent.match(/\t/g) || []).length;
        const spaceCount = (rawIndent.match(/ /g) || []).length;
        let level = tabCount + Math.floor(spaceCount / 4);
        // Adjust level so that a list item with no indent is treated as level 1.
        level++;
        // For markdown items, ignore the raw leading whitespace since our prefixes determine indentation.
        return { 
          level,
          leadingWhitespace: '',
          text: listMatch[3]
        };
      }
      
      // Try matching the equal‑sign syntax (e.g., "=level one" or "= level one").
      const eqMatch = line.match(/^(=+)\s?(.*)$/);
      if (eqMatch) {
        const level = eqMatch[1].length;
        const text = eqMatch[2];
        return { 
          level, 
          leadingWhitespace: '',
          text
        };
      }
      
      // If no marker is found, treat the line as level 0.
      return { level: 0, leadingWhitespace: '', text: line };
    });
  
    const hierarchy: boolean[] = [];
  
    const output = nodes.map((node, index) => {
      let isLast = true;
      // Determine whether this node is the last one at its level.
      for (let j = index + 1; j < nodes.length; j++) {
        if (nodes[j].level < node.level) break;
        if (nodes[j].level === node.level) {
          isLast = false;
          break;
        }
      }
  
      hierarchy[node.level] = isLast;
      hierarchy.length = node.level + 1;
  
      let prefix = '';
      // Build the prefix for each level above the current node.
      for (let lvl = 1; lvl < node.level; lvl++) {
        prefix += hierarchy[lvl] ? '    ' : '│   ';
      }
      // Append the branch indicator for the current node.
      if (node.level > 0) {
        prefix += isLast ? '└── ' : '├── ';
      }
  
      // Combine the common indent, any preserved leading whitespace (if needed), 
      // the computed prefix, and the node's text.
      return `${commonIndent}${node.leadingWhitespace}${prefix}${node.text}`;
    }).join('\n');
  
    // SAFE DOM construction.
    el.empty();
    const pre = el.createEl('pre');
    const code = pre.createEl('code');
    code.setText(output);
  };
}
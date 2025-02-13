import { Plugin } from 'obsidian';

export default class TreePlugin extends Plugin {
  async onload() {
    this.registerMarkdownCodeBlockProcessor('tree', this.treeProcessor);
  }

  private treeProcessor = (source: string, el: HTMLElement) => {
    const lines = source.split('\n');
    const nodes = lines.map(line => {
      const level = (line.match(/=/g) || []).length;
      const textPart = line.replace(/=+/g, '');
      const leadingWhitespace = (textPart.match(/^[\t ]*/) || [''])[0];
      const text = textPart.slice(leadingWhitespace.length);
      
      return { 
        level,
        leadingWhitespace,
        text
      };
    });
  
    const hierarchy: boolean[] = [];
  
    const output = nodes.map((node, index) => {
      let isLast = true;
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
      for (let lvl = 1; lvl < node.level; lvl++) {
        prefix += hierarchy[lvl] ? '    ' : '│   ';
      }
      if (node.level > 0) {
        prefix += isLast ? '└── ' : '├── ';
      }
  
      return `${node.leadingWhitespace}${prefix}${node.text}`;
    }).join('\n');
  

    // SAFE DOM construction
    el.empty();
    const pre = el.createEl('pre');
    const code = pre.createEl('code');
    code.setText(output);
  };
}

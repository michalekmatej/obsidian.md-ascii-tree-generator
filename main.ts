import { Plugin, Editor, MarkdownView, App, PluginSettingTab, Setting, MarkdownPostProcessorContext } from 'obsidian';

interface AsciiTreeSettings {
  dashCount: number;
  autoAppendSlash: boolean;
}

const DEFAULT_SETTINGS: AsciiTreeSettings = {
  dashCount: 2,
  autoAppendSlash: false,
};

export default class TreePlugin extends Plugin {
  settings: AsciiTreeSettings;

  async onload() {
    await this.loadSettings();
    this.addSettingTab(new AsciiTreeSettingTab(this.app, this));

    this.registerMarkdownCodeBlockProcessor('tree', this.treeProcessor);
    
    // Add command to convert selected text to tree code block
    this.addCommand({
      id: 'convert-to-tree-block',
      name: 'Convert selection to tree code block',
      editorCallback: (editor: Editor, view: MarkdownView) => {
        this.convertSelectionToTreeBlock(editor);
      }
    });

    // Add command to remove tree code block
    this.addCommand({
      id: 'remove-tree-block',
      name: 'Convert tree block back to text',
      editorCallback: (editor: Editor, view: MarkdownView) => {
        this.removeTreeBlock(editor);
      }
    });

    // Add command to toggle tree block
    this.addCommand({
      id: 'toggle-tree-block',
      name: 'Toggle tree block',
      editorCallback: (editor: Editor, view: MarkdownView) => {
        this.toggleTreeBlock(editor);
      }
    });
  }

  async loadSettings() {
    this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
  }

  async saveSettings() {
    await this.saveData(this.settings);
  }

  private treeProcessor = (source: string, el: HTMLElement, ctx: MarkdownPostProcessorContext) => {
    const { autoAppendSlash } = this.settings;

    // Allow per-block dash count via ```tree <n>  (e.g. ```tree 4).
    // Falls back to the global setting when no number is specified.
    let dashCount = this.settings.dashCount;
    const sectionInfo = ctx.getSectionInfo(el);
    if (sectionInfo) {
      const fenceLine = sectionInfo.text.split('\n')[sectionInfo.lineStart];
      const fenceMatch = fenceLine.match(/^`{3,}tree\s+(\d+)\s*$/i);
      if (fenceMatch) {
        const parsed = parseInt(fenceMatch[1], 10);
        if (parsed >= 1 && parsed <= 10) dashCount = parsed;
      }
    }

    const dashes = '─'.repeat(dashCount);
    const branch     = '├' + dashes + ' ';
    const lastBranch = '└' + dashes + ' ';
    const vertical   = '│' + ' '.repeat(dashCount + 1);
    const empty      = ' '.repeat(dashCount + 2);

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
      // Try matching markdown list syntax that supports unordered ("-", "*", "+",
      // and common Unicode equivalents like ─ — – • ⁃) or ordered lists (e.g., "1. level one").
      const listMatch = line.match(/^([\t ]*)((?:[-*+─—–‒•⁃])|\d+\.)\s+(.*)$/);
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
        return {
          level: eqMatch[1].length,
          leadingWhitespace: '',
          text: eqMatch[2]
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
        prefix += hierarchy[lvl] ? empty : vertical;
      }
      if (node.level > 0) {
        prefix += isLast ? lastBranch : branch;
      }

      // Auto-append slash to items that have children in the tree.
      let text = node.text;
      if (autoAppendSlash && node.level > 0) {
        const hasChildren = index + 1 < nodes.length && nodes[index + 1].level > node.level;
        if (hasChildren && !text.endsWith('/')) {
          text += '/';
        }
      }

      return `${commonIndent}${node.leadingWhitespace}${prefix}${text}`;
    }).join('\n');
  
    // SAFE DOM construction.
    el.empty();
    const pre = el.createEl('pre');
    const code = pre.createEl('code');
    code.setText(output);
  };

  private convertSelectionToTreeBlock(editor: Editor) {
    const selection = editor.getSelection();
    
    if (selection) {
      // Wrap the selected text in a tree code block
      const treeBlock = `\`\`\`tree\n${selection}\n\`\`\``;
      editor.replaceSelection(treeBlock);
    } else {
      // If no selection, wrap the current line in a tree code block
      const cursor = editor.getCursor();
      const currentLine = cursor.line;
      const lineContent = editor.getLine(currentLine);
      
      const treeBlock = `\`\`\`tree\n${lineContent}\n\`\`\``;
      
      // Replace the entire current line with the tree block
      const lineStart = { line: currentLine, ch: 0 };
      const lineEnd = { line: currentLine, ch: lineContent.length };
      
      editor.replaceRange(treeBlock, lineStart, lineEnd);
      
      // Position cursor inside the code block (on the line with the content)
      editor.setCursor(currentLine + 1, lineContent.length);
    }
  }

  private removeTreeBlock(editor: Editor) {
    const cursor = editor.getCursor();
    const content = editor.getValue();
    const lines = content.split('\n');
    const currentLine = cursor.line;

    // Find the tree code block boundaries
    let startLine = -1;
    let endLine = -1;

    // Search backwards from cursor to find the opening ```tree.
    // Skip the guard on the starting line so a cursor on the closing ``` still finds the opener.
    for (let i = currentLine; i >= 0; i--) {
      if (lines[i].trim().match(/^```tree\s*$/)) {
        startLine = i;
        break;
      }
      if (i !== currentLine && lines[i].trim().match(/^```/)) {
        break;
      }
    }

    // If we found a start, search forwards to find the closing ```
    if (startLine !== -1) {
      for (let i = startLine + 1; i < lines.length; i++) {
        if (lines[i].trim() === '```') {
          endLine = i;
          break;
        }
      }
    }

    // If we found both boundaries, remove the code block
    // Now also handle when cursor is on the start or end line
    if (startLine !== -1 && endLine !== -1 && 
        currentLine >= startLine && currentLine <= endLine) {
      // Get the content inside the code block (excluding the ``` lines)
      const innerContent = lines.slice(startLine + 1, endLine).join('\n');
      
      // Replace the entire code block with just its inner content
      const from = { line: startLine, ch: 0 };
      const to = { line: endLine, ch: lines[endLine].length };
      
      editor.replaceRange(innerContent, from, to);
      
      // Position cursor at the beginning of where the content now is
      editor.setCursor(startLine, 0);
    }
  }

  private toggleTreeBlock(editor: Editor) {
    // Check if cursor is inside a tree code block
    if (this.isInsideTreeBlock(editor)) {
      // If inside tree block, remove it
      this.removeTreeBlock(editor);
    } else {
      // If not inside tree block, convert selection to tree block
      this.convertSelectionToTreeBlock(editor);
    }
  }

  private isInsideTreeBlock(editor: Editor): boolean {
    const cursor = editor.getCursor();
    const content = editor.getValue();
    const lines = content.split('\n');
    const currentLine = cursor.line;

    // Find the tree code block boundaries
    let startLine = -1;
    let endLine = -1;

    // Search backwards from cursor to find the opening ```tree
    for (let i = currentLine; i >= 0; i--) {
      if (lines[i].trim().match(/^```tree\s*$/)) {
        startLine = i;
        break;
      }
      if (i !== currentLine && lines[i].trim().match(/^```/)) {
        break;
      }
    }

    // If we found a start, search forwards to find the closing ```
    if (startLine !== -1) {
      for (let i = startLine + 1; i < lines.length; i++) {
        if (lines[i].trim() === '```') {
          endLine = i;
          break;
        }
      }
    }

    // Return true if cursor is anywhere within the tree code block (including start and end lines)
    return startLine !== -1 && endLine !== -1 && currentLine >= startLine && currentLine <= endLine;
  }
}

class AsciiTreeSettingTab extends PluginSettingTab {
  plugin: TreePlugin;

  constructor(app: App, plugin: TreePlugin) {
    super(app, plugin);
    this.plugin = plugin;
  }


  display(): void {
    const { containerEl } = this;
    containerEl.empty();

    new Setting(containerEl)
      .setName('Connector dashes')
      .setDesc('Sets how many dash characters follow each branch symbol. 2 gives the classic ├── style.')
      .addSlider(slider => slider
        .setLimits(1, 10, 1)
        .setValue(this.plugin.settings.dashCount)
        .setDynamicTooltip()
        .onChange(async (value) => {
          this.plugin.settings.dashCount = value;
          await this.plugin.saveSettings();

        }));

    new Setting(containerEl)
      .setName('Auto-append / to folders')
      .setDesc('Automatically add a trailing slash to any item that has children in the tree.')
      .addToggle(toggle => toggle
        .setValue(this.plugin.settings.autoAppendSlash)
        .onChange(async (value) => {
          this.plugin.settings.autoAppendSlash = value;
          await this.plugin.saveSettings();

        }));
  }
}

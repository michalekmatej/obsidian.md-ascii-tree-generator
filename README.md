# ASCII Tree Generator for Obsidian

Transform indented outlines into beautiful ASCII tree diagrams directly in your Obsidian notes. Perfect for technical documentation, project hierarchies, or mind-mapping.

## **Features**:

-   **Simple Syntax**: Use either standard markdown lists or `=` characters to indicate nesting levels
-   **Automatic Hierarchy Detection**: Converts markdown code blocks into ASCII trees
-   **Multi-Level Support**: Handles unlimited nesting levels with proper indentation
-   **Clean Formatting**: Produces professional-looking trees with proper box-drawing characters
-   **Dual-Mode Display**: Renders trees in both **preview** and **editing** modes
-   **Native Markdown Compatible**: Works with standard markdown list indentation

## **How to Use**:

### Method 1: Using markdown lists

1. Create a code block with `tree` keyword as a language identifier.
2. Use standard markdown list syntax:
    - Unordered lists with `-`, `*`, or `+`
    - Ordered lists with numbers (`1.`, `2.`, etc.)
    - Standard tab indentation for nesting levels

### Method 2: Using equals signs

1. Create a code block with `tree` keyword as a language identifier.
2. Indent hierarchy levels using `=` signs:
    - Each `=` represents one level of nesting
    - Example: `==subitem` → two levels deep

## **Example usage**:

**Example 1 (with markdown lists)**:

```tree
Project
- Documentation
  - README.md
  - Changelog.md
- Source
  - Frontend
    - Components
      - Header
      - Footer
  - Backend
    - API
      - User
      - Product
- Tests
  - Unit
  - Integration
```

**Output**:

```
Project
├── Documentation
│   ├── README.md
│   └── Changelog.md
├── Source
│   ├── Frontend
│   │   └── Components
│   │       ├── Header
│   │       └── Footer
│   └── Backend
│       └── API
│           ├── User
│           └── Product
└── Tests
    ├── Unit
    └── Integration
```

**Example 2 (with equals signs)**:

```tree
Project
=Documentation
==README.md
==Changelog.md
=Source
==Frontend
===Components
====Header
====Footer
==Backend
===API
====User
====Product
=Tests
==Unit
==Integration
```

**Output**:

```
Project
├── Documentation
│   ├── README.md
│   └── Changelog.md
├── Source
│   ├── Frontend
│   │   └── Components
│   │       ├── Header
│   │       └── Footer
│   └── Backend
│       └── API
│           ├── User
│           └── Product
└── Tests
    ├── Unit
    └── Integration
```

## **Available Commands**:

This plugin provides three convenient commands accessible through the Command Palette (`Ctrl/Cmd + P`):

### **Convert selection to tree code block**
- **Usage**: Select text and run this command to wrap it in a `tree` code block
- **Behavior**: 
  - With text selected: Wraps selection in `tree` code block
  - Without selection: Wraps the current line in `tree` code block
- **Perfect for**: Converting existing lists or hierarchies into tree format

### **Convert tree block back to text**
- **Usage**: Place cursor anywhere within a tree code block and run this command
- **Behavior**: Removes the `tree` wrapper, leaving just the plain text content

### **Toggle tree block**
- **Usage**: Smart command that automatically chooses between adding or removing a `tree` code block
- **Behavior**:
  - If cursor is **inside** a tree block → removes the tree block
  - If cursor is **outside** a tree block → converts selection/line to tree block

**💡 Tip**: Assign keyboard shortcuts to these commands in Obsidian's Hotkeys settings for even faster workflow.

## **Settings**:

The plugin settings page (Obsidian Settings → Community Plugins → ASCII Tree Generator) lets you configure:

- **Connector dashes** — how many `─` characters follow each `├` or `└`. Default is 2, giving the classic `├──` style. Can be set between 1 and 10.
- **Auto-append / to folders** — automatically adds a trailing `/` to any item that has children in the tree.

### **Per-block connector width**

You can override the global connector width for a specific block by adding a number after `tree` on the opening fence line:

````
```tree 4
Project
- src
  - main.ts
- docs
  - README.md
```
````

This produces `├────` connectors just for that block, while all other blocks keep using the global setting.

## **Installation**:

1. Available through Obsidian's Community Plugins
2. Search for "ASCII Tree Generator"
3. Enable plugin after installation

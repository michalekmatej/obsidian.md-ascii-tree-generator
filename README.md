# Obsidian ASCII Tree Generator

Transform indented outlines into beautiful ASCII tree diagrams directly in your Obsidian notes. Perfect for technical documentation, project hierarchies, or mind-mapping.

## **Features**:

-   **Simple Syntax**: Use `=` characters to indicate nesting levels
-   **Automatic Hierarchy Detection**: Converts markdown code blocks into ASCII trees
-   **Multi-Level Support**: Handles unlimited nesting levels with proper indentation
-   **Clean Formatting**: Produces professional-looking trees with proper box-drawing characters
-   **Dual-Mode Display**: Renders trees in both **preview** and **editing** modes

## **How to Use**:

1. Create a code block with `tree` keyword as a language identifier.
2. Indent hierarchy levels using `=` signs:
    - Each `=` represents one level of nesting
    - Example: `==subitem` → two levels deep

## **Example usage**:

**Example 1**:

```tree
root
=child1
==subchild1
==subchild2
=child2
```

**Output**:

```
root
├── child1
│   ├── subchild1
│   └── subchild2
└── child2
```

**Example 2**:

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

## **Installation**:

1. Available through Obsidian's Community Plugins
2. Search for "ASCII Tree Generator"
3. Enable plugin after installation

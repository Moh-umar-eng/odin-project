# Document

### Table of Conents

- [Document Spec, Browser](#document-spec--browser)
- [DOM Tree]()
- [Walking DOM]()
- [Searching `getElement*, querySelector*`]()
- []()
- []()
- []()
- []()
- []()

## Document Spec & Browser

In a browser, JavaScript does not execute in a vacuum. It runs inside a host environment that provides a root container object: **`window`**.

The `window` object serves a dual role:

1. **Global Object for JavaScript:** It acts as the top-level execution namespace (e.g., standard built-ins like `Math`, `parseInt`, and `globalThis` refer to it).
2. **Browser Window Representation:** It exposes the APIs and data structures needed to read, manipulate, and control the page and browser itself.

The browser platform breaks these host capabilities into three main pillars:

```
                  ┌────────────────────────┐
                  │         window         │
                  └───────────┬────────────┘
         ┌────────────────────┼────────────────────┐
         │                    │                    │
         ▼                    ▼                    ▼
   ┌───────────┐        ┌───────────┐        ┌───────────┐
   │    DOM    │        │    BOM    │        │JavaScript │
   │ (document)│        │(navigator,│        │ (Core JS, │
   │           │        │location...)        │  types)   │
   └───────────┘        └───────────┘        └───────────┘

```

---

### 1. The DOM (Document Object Model)

The **DOM** represents all page content as a tree of modifiable objects. The primary entry point is `window.document` (or simply `document`).

Through the DOM, JavaScript can:

* Inspect and modify elements, attributes, and text nodes.
* Add or remove entire DOM subtrees dynamically.
* Alter element styling and compute layout geometries.

```javascript
// Changing the document background using the DOM
document.body.style.background = "red";

```

The DOM is standardized by **WHATWG** (and historically W3C), meaning the underlying structure and methods (`querySelector`, `addEventListener`) behave consistently across all standard-compliant engines.

---

### 2. The BOM (Browser Object Model)

The **BOM** provides objects for interacting with the host environment outside the document itself. Unlike the DOM, early BOM implementations had no unified standard, though modern browsers follow the HTML living standard for consistent behavior.

Key BOM objects attached directly to `window`:

| Object | Purpose | Common Properties/Methods |
| --- | --- | --- |
| `navigator` | Device, browser, and network metadata | `navigator.userAgent`, `navigator.onLine`, `navigator.clipboard` |
| `location` | Current URL parsing and navigation | `location.href`, `location.origin`, `location.reload()` |
| `history` | Browser session navigation stack | `history.back()`, `history.pushState()` |
| `screen` | Hardware display attributes | `screen.width`, `screen.height`, `screen.colorDepth` |

```javascript
// Reading host metadata and navigating
console.log(navigator.userAgent);
if (!navigator.onLine) {
  console.warn("Device is offline");
}

// Redirect using BOM
// location.href = "https://example.com";

```

Dialogs like `alert()`, `confirm()`, and `prompt()` are also BOM functions on `window`, though modern UI workflows avoid them because they are modal and block JavaScript execution.

---

### 3. The CSSOM (CSS Object Model)

While the DOM represents the HTML structure, the **CSSOM** represents stylesheets and rules as objects. When an element's style is accessed via `document.body.style`, you are interacting with its inline CSSOM properties.

To read styles applied by external stylesheets or cascading inheritance, use:

```javascript
const computed = getComputedStyle(document.body);
console.log(computed.marginTop);

```

---

### When to Use

* **DOM:** Use whenever you need to render UI, update text, toggle classes, attach interaction handlers, or modify the visual hierarchy.
* **BOM:**
* Route handling in Single-Page Applications (SPAs) via `history.pushState()` and `location`.
* Feature detection, checking network status, or accessing hardware integrations (e.g., service workers, geolocation, cameras) via `navigator`.
* Responsive screen queries and cross-origin communication checks.



---

### Production-Level Tips & Tricks

**1. Isomorphic / SSR Checks (Next.js, Remix, Node)**
In Server-Side Rendering (SSR), your code runs in Node.js first, where `window`, `document`, and `navigator` do not exist. Directly referencing `window` in top-level code throws a fatal `ReferenceError: window is not defined`.
Always guard host-object access:

```javascript
// Guarding against non-browser execution
if (typeof window !== "undefined") {
  const currentPath = window.location.pathname;
}

// Or check for the Document explicitly
const isBrowser = typeof document !== "undefined";

```

**2. BOM-driven Memory Leaks via `history.pushState**`
Modern frontend routers use the History API (`history.pushState`) to change pages without full refreshes. Because the browser page never reloads, global event listeners (like `window.addEventListener('resize', ...)`) and open timers remain alive forever unless explicitly cleaned up when unmounting views.

**3. `navigator.userAgent` Spoofing**
Never rely on `navigator.userAgent` strings to detect browser features or apply polyfills. User-agent strings are easily spoofed, inconsistent, and often freeze versions to maintain legacy web compatibility.
*Fix:* Always use **feature detection** instead:

```javascript
// BAD: Browser sniffing
if (navigator.userAgent.includes("Chrome")) { /* ... */ }

// GOOD: Feature detection
if ("IntersectionObserver" in window) {
  // Safe to use IntersectionObserver
}

```

**4. Script Placement and Execution Timing**
If a `<script>` tag is placed in the `<head>` without attributes, it executes before the DOM tree finishes parsing. At that moment, `document.body` is `null`.
*Fix:* Use `defer` on script tags (`<script defer src="..."></script>`) to allow HTML parsing to proceed in parallel while guaranteeing execution runs after the DOM is fully constructed, but before `DOMContentLoaded`.

---

## DOM Tree

The backbone of an HTML document is tags. The browser parses these nested tags and constructs an in-memory hierarchical structure called the **Document Object Model (DOM) tree**. Every HTML tag, piece of text, and comment becomes an individual node in this tree.

```
                  ┌───────────────┐
                  │   document    │
                  └───────┬───────┘
                          │
                  ┌───────▼───────┐
                  │ <html> (elem) │
                  └───────┬───────┘
            ┌─────────────┴─────────────┐
            ▼                           ▼
    ┌───────────────┐           ┌───────────────┐
    │ <head> (elem) │           │ <body> (elem) │
    └───────┬───────┘           └───────┬───────┘
            │                           │
    ┌───────▼───────┐           ┌───────▼───────┐
    │ <title>(elem) │           │  <h1> (elem)  │
    └───────┬───────┘           └───────┬───────┘
            │                           │
    ┌───────▼───────┐           ┌───────▼───────┐
    │ "Hello" (text)│           │"Header" (text)│
    └───────────────┘           └───────────────┘

```

The top-most node is the root object `document`. Directly beneath it sits `<html>` (`document.documentElement`), which branches out into `<head>` and `<body>` (`document.body`).

---

### The Primary Node Types

While there are 12 different node types defined in the DOM specification, four dominate real-world web development:

1. **Document Node (`nodeType === 9`):** The global entry point (`document`).
2. **Element Nodes (`nodeType === 1`):** HTML tags (`<div>`, `<p>`, `<a>`, `<body>`). These form the visual and structural backbone of the tree.
3. **Text Nodes (`nodeType === 3`):** The actual character data contained inside tags. Text nodes are always **leaf nodes**—they cannot have children. Even whitespace and newlines between HTML tags create text nodes.
4. **Comment Nodes (`nodeType === 8`):** `<!-- comment -->`. Even though they do not render visually, comments are full citizens of the DOM tree and can be read or modified by JavaScript.

```javascript
const heading = document.querySelector('h1');

console.log(heading.nodeType); // 1 (Element)
console.log(heading.firstChild.nodeType); // 3 (Text node inside h1)

```

---

### Autocorrection in the DOM Tree

The HTML parser is remarkably forgiving. If incoming HTML is malformed, the browser fixes it automatically before creating the DOM tree:

* **Missing top-level tags:** If your markup omits `<html>`, `<head>`, or `<body>`, the browser inserts them anyway.
* **Unclosed tags:** If you write `<p>Hello<p>World`, the browser automatically closes the first `<p>` when it encounters the next one.
* **Table structure:** The parser requires a `<tbody>` inside a `<table>`. If you omit it in your HTML:
```html
<table><tr><td>Data</td></tr></table>

```


The resulting DOM tree will physically include `<tbody>`:
```
table -> tbody -> tr -> td

```


Targeting `table > tr` with direct CSS child selectors will fail because `tbody` sits silently between them.

---

### When to Use

* **Deep Tree Walking:** Custom web scrapers, markdown/rich-text editors (like ProseMirror or Lexical), or accessibility auditors that must parse raw text nodes and inline elements without stripping whitespace.
* **Custom Sanitization:** Parsing third-party HTML into an in-memory document fragment to inspect or remove unsafe elements before rendering.
* **Virtual DOM / Reconciliation Engines:** Building rendering pipelines (like React or Vue core) where the framework maintains a lightweight blueprint of element nodes and reconciles it against the real DOM.

---

### Production-Level Tips & Tricks

**1. The Hidden Whitespace Text Nodes**
One of the most common pitfalls when manually traversing nodes is unexpected whitespace text nodes.

```html
<ul id="list">
  <li>Item 1</li>
</ul>

```

If you access `document.getElementById('list').firstChild`, you will likely get a **Text node** containing `"\n  "`, not the `<li>` element.
*Fix:* Distinguish between **Node navigation** (`firstChild`, `nextSibling`, `childNodes`) and **Element navigation** (`firstElementChild`, `nextElementSibling`, `children`). Always use the `Element` variants when working with UI tags:

```javascript
const list = document.getElementById('list');
console.log(list.firstElementChild); // <li>Item 1</li>

```

**2. Inspecting the True DOM via DevTools**
The Chrome/Edge DevTools **Elements** panel displays the DOM tree, *not* the raw HTML file sent over the wire. If you want to see the literal raw HTML returned by the server before the browser fixed syntax errors, use `Right-Click -> View Page Source` instead of the DevTools element inspector.

**3. In the Console: `$0**`
When inspecting an element in the browser's DevTools Elements tab, the currently highlighted node is automatically mapped to the variable `$0` in the Console tab. `$1` is the previously selected element. This is the fastest way to test DOM tree methods during active debugging.

**4. `textContent` vs `innerHTML` vs `innerText**`
When reading or inserting text into an element node:

* `innerHTML`: Parses markup into element nodes (vulnerable to XSS if inserting untrusted user data).
* `textContent`: Treats everything as raw characters, creating or updating a pure text node. Fast and safe.
* `innerText`: Aware of CSS styling (triggering a layout/reflow check to determine if the text is hidden by `display: none`). It is significantly slower than `textContent`.

---

## Walking the DOM

"Walking the DOM" refers to navigating between DOM nodes using direct relational properties (parents, children, and siblings) without running query lookups.

The top-level entry points are exposed directly on `document`:

* `document.documentElement` $\rightarrow$ `<html>`
* `document.body` $\rightarrow$ `<body>`
* `document.head` $\rightarrow$ `<head>`

> **Note on `document.body`:** If a script runs inside `<head>` without `defer` or `async`, `document.body` evaluates to `null` because the engine hasn't encountered the `<body>` tag yet.

---

### Node Navigation vs. Element Navigation

The DOM specification provides two parallel sets of navigation properties:

1. **Node Properties:** Traverses *every* node type (elements, text nodes with whitespace/newlines, comments).
2. **Element Properties:** Filters out whitespace and comments, hopping strictly between HTML element tags (`nodeType === 1`).

| Direction / Target | All Nodes (Node Level) | Elements Only (Tag Level) |
| --- | --- | --- |
| **Parent** | `parentNode` | `parentElement` |
| **Children Collection** | `childNodes` | `children` |
| **First Child** | `firstChild` | `firstElementChild` |
| **Last Child** | `lastChild` | `lastElementChild` |
| **Previous Sibling** | `previousSibling` | `previousElementSibling` |
| **Next Sibling** | `nextSibling` | `nextElementSibling` |

```html
<ul id="menu">
  <!-- navigation items -->
  <li>Home</li>
  <li>Articles</li>
</ul>

```

```javascript
const menu = document.getElementById('menu');

// Node-level traversal sees whitespace and comments
console.log(menu.firstChild);        // #text "\n  "
console.log(menu.firstChild.nextSibling); // <!-- navigation items -->

// Element-level traversal jumps straight to tags
console.log(menu.firstElementChild); // <li>Home</li>
console.log(menu.firstElementChild.nextElementSibling); // <li>Articles</li>

```

---

### Special Tabular Navigation

Navigating complex table structures using standard node relationships gets messy quickly because tables have strict internal parsing structures (`tbody`, `tr`, `td`). To simplify this, HTML tables expose dedicated navigation shortcuts:

* `table.rows` — collection of `<tr>` elements.
* `table.caption`, `table.tHead`, `table.tFoot` — references to specific table components.
* `table.tBodies` — collection of `<tbody>` elements.
* `tbody.rows` — rows inside that specific body.
* `tr.cells` — collection of `<td>` and `<th>` cells inside that row.
* `tr.sectionRowIndex` — row's index relative to enclosing `<thead>`/`<tbody>`.
* `tr.rowIndex` — overall row index across the entire table.
* `td.cellIndex` — index of the cell inside its parent `<tr>`.

```javascript
// Quick direct cell access without nested querySelector calls
const cell = myTable.rows[1].cells[2];

```

---

### When to Use

* **High-Frequency Traversal (Performance):** Direct navigation properties (`parentElement`, `children`, `nextElementSibling`) are raw pointer hops in C++ engine memory. They are significantly faster than query parsing engines (`querySelector`, `closest`).
* **Sibling-Based UI Components:** Steppers, tabs, accordion panels, and nested dropdown menus where an action on one element requires mutating its immediate neighbor.
* **Lightweight DOM Trees:** Custom custom elements/Web Components inspecting their direct slotted children.

---

### Production-Level Tips & Tricks

**1. `childNodes` and `children` are Live Collections**
`childNodes` and `children` are not static JavaScript arrays. They are **live collections** (`NodeList` and `HTMLCollection` respectively). If you insert or remove an element in the DOM, the collection reflects the update immediately.

```javascript
const list = document.getElementById('list');
const items = list.children; // HTMLCollection

console.log(items.length); // e.g., 3
list.append(document.createElement('li'));
console.log(items.length); // 4 (auto-updated without re-querying!)

```

*Risk in Loops:* Modifying the DOM inside an ascending index loop iterating over a live collection can create infinite loops or skipped indices.

**2. Converting Collections to Real Arrays**
Neither `NodeList` nor `HTMLCollection` has standard array transformation methods like `map()`, `filter()`, or `reduce()` (though modern `NodeList` supports `forEach()`).
Convert them upfront with spread syntax or `Array.from()`:

```javascript
// Convert to real Array to use map/filter safely
const activeItems = [...container.children].filter(el => el.classList.contains('active'));

```

**3. `parentElement` vs `parentNode` Edge Case**
In 99.9% of cases, `parentNode` and `parentElement` return the identical node. The single exception is the document root:

```javascript
document.documentElement.parentNode;    // document (Node type 9)
document.documentElement.parentElement; // null (document is not an Element!)

```

Use `parentElement` when you want a clean walk up the tree that safely terminates at `null` once it reaches the root element.

**4. Walking the Tree with `TreeWalker` and `NodeIterator**`
If you need to recursively inspect deep trees (e.g., finding all text nodes, or skipping specific subtrees), avoid writing manual recursive loops with `children`. Use the browser's built-in `document.createTreeWalker()` API:

```javascript
const walker = document.createTreeWalker(
  document.body,
  NodeFilter.SHOW_TEXT,
  {
    acceptNode(node) {
      return node.textContent.trim() ? NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_REJECT;
    }
  }
);

let textNode;
while ((textNode = walker.nextNode())) {
  // Ultra-fast C++ iteration across text nodes without recursion limits
  console.log(textNode.textContent);
}

```

---

## Searching : `getElement*, querySelector*`

Searching allows you to jump directly to any node in the DOM without manually traversing the hierarchy from the root or parent.

The DOM offers two primary families of search methods:

1. **The Modern Selectors API:** `querySelector` and `querySelectorAll` (CSS selector based).
2. **The Legacy Methods:** `getElementById`, `getElementsByTagName`, `getElementsByClassName`, and `getElementsByName`.

---

### 1. Modern Selectors: `querySelector` & `querySelectorAll`

These methods accept any valid CSS selector string (including complex selectors like `:nth-child`, attribute selectors, and combinators).

* `elem.querySelector(css)` returns the **first matching Element**, or `null` if nothing matches.
* `elem.querySelectorAll(css)` returns a **static `NodeList**` of all matching Elements.

```javascript
// Target by complex CSS syntax
const activeNav = document.querySelector('nav.primary > ul li.active a[href^="/dashboard"]');

// Select all buttons inside dialogs
const dialogButtons = document.querySelectorAll('dialog button.confirm');

```

These methods exist on both `document` and any individual `Element`, allowing you to scope the lookup to a specific subtree:

```javascript
const userCard = document.querySelector('.user-card');
const avatar = userCard.querySelector('.avatar-img'); // Searches strictly inside userCard

```

---

### 2. Legacy Lookups: `getElements*`

These older methods are more limited in syntax, but each specializes in a single attribute:

| Method | Target | Returns | Live or Static? |
| --- | --- | --- | --- |
| `document.getElementById('id')` | Target `id` attribute | Single `Element` or `null` | N/A |
| `elem.getElementsByTagName('tag')` | Tag name (e.g. `'div'`, `'*'`) | `HTMLCollection` | **Live** |
| `elem.getElementsByClassName('cls')` | Class name | `HTMLCollection` | **Live** |
| `document.getElementsByName('name')` | Tag with `name="..."` attribute | `NodeList` | **Live** |

> Note: `getElementById` only exists on `document`, not on individual elements.

---

### 3. Directional Lookups: `matches` and `closest`

In modern event-driven architectures, you frequently need to check what an element matches or look *upwards* into its ancestors:

* **`elem.matches(css)`:** Returns `true` if `elem` matches the given CSS selector, otherwise `false`. Excellent for conditional checks inside event listeners.
* **`elem.closest(css)`:** Climbs the DOM tree starting from `elem` itself, moving through parent elements until it finds a selector match. Returns the matching element or `null`.

```javascript
const link = document.querySelector('.nav-link');

// Checks current element against selector
if (link.matches(':disabled')) { /* ... */ }

// Looks upward to find enclosing modal
const modal = link.closest('.modal-container');

```

---

### The Critical Difference: Live vs. Static Collections

This is one of the most important concepts for writing predictable, bug-free DOM code:

* `getElementsBy*` returns a **live** collection. It reflects DOM changes immediately without re-querying.
* `querySelectorAll` returns a **static** snapshot. It will *not* update if nodes are added or removed later.

```javascript
const liveList = document.getElementsByClassName('item');
const staticList = document.querySelectorAll('.item');

console.log(liveList.length);   // Say, 2
console.log(staticList.length); // 2

// Add a 3rd element to the DOM
const newItem = document.createElement('div');
newItem.className = 'item';
document.body.append(newItem);

console.log(liveList.length);   // 3 (Updated automatically!)
console.log(staticList.length); // 2 (Frozen snapshot)

```

---

### When to Use

* **Default to `querySelector` / `querySelectorAll`:** Standardize on these for nearly all everyday lookups. They support unified CSS syntax, work identically across elements, and avoid unexpected mutations from live collections.
* **Use `getElementById`:** When pinpointing a single unique element with a known ID where lookup performance is critical.
* **Use `closest`:** Indispensable for **event delegation** (handling events on container elements and finding which child was clicked).
* **Use `getElementsByClassName` / `TagName`:** Only in performance-bottlenecked sections where you continuously query large DOM sets and need the micro-optimization of engine-level cached live collections.

---

### Production-Level Tips & Tricks

**1. Event Delegation with `closest` and `matches**`
Avoid attaching click handlers to hundreds of individual elements (e.g., table rows or list items). Instead, attach one listener to the parent container and use `event.target.closest()` to resolve the target:

```javascript
const table = document.querySelector('#data-table');

table.addEventListener('click', (event) => {
  // Finds the closest button even if the user clicked an SVG/span inside it
  const actionBtn = event.target.closest('button[data-action]');
  if (!actionBtn || !table.contains(actionBtn)) return;

  const action = actionBtn.dataset.action;
  console.log(`Executing ${action}`);
});

```

**2. Scoped Lookups and the `:scope` Pseudo-Class**
When running `elem.querySelectorAll('div span')`, the CSS selector evaluates against the whole document context to resolve matching, then filters down to `elem`'s descendants. If you want to enforce that a selector starts *strictly* from the parent's immediate children, use `:scope`:

```javascript
// Matches only <span> tags that are DIRECT children of container
const directSpans = container.querySelectorAll(':scope > span');

```

**3. The Infinite Loop Trap with Live Collections**
Iterating over a live collection while adding elements matching that collection creates an infinite loop:

```javascript
// DANGEROUS:
const items = document.getElementsByClassName('alert');
for (let i = 0; i < items.length; i++) {
  // If this function appends another element with class 'alert',
  // items.length increases on each loop, creating an infinite lockup.
  document.body.append(document.createElement('div')).className = 'alert';
}

// SAFE: querySelectorAll snapshot
const items = document.querySelectorAll('.alert');
for (let i = 0; i < items.length; i++) {
  // items.length is fixed at snapshot time
}

```

**4. Performance Benchmarks in Practice**
`document.getElementById('id')` is roughly 2x–4x faster than `document.querySelector('#id')` because browsers use an internal hash map indexed directly by ID, bypassing the CSS selector parsing engine. For micro-benchmarks or 60fps animations/drag loops, stick to `getElementById`. For everything else, `querySelector` is fast enough that the difference is negligible.

---


## Node Properties : types, tag & contents

Every DOM node is an instance of an underlying built-in JavaScript class. These classes form an object-oriented inheritance tree that dictates what properties and methods are available on any given node.

The hierarchy looks like this:

```
                  ┌───────────────┐
                  │  EventTarget  │ (Base class: adds addEventListener, removeEventListener)
                  └───────┬───────┘
                          │
                  ┌───────▼───────┐
                  │     Node      │ (Base DOM node: adds parentNode, firstChild, nodeType)
                  └───────┬───────┘
            ┌─────────────┴─────────────┐
            ▼                           ▼
    ┌───────────────┐           ┌───────────────┐
    │    Element    │           │ CharacterData │ (Text, Comment)
    └───────┬───────┘           └───────────────┘
            │
    ┌───────▼───────┐
    │  HTMLElement  │ (HTML elements: adds hidden, tabIndex, style, title)
    └───────┬───────┘
            │
   ┌────────┴────────┬───────────────────┐
   ▼                 ▼                   ▼
HTMLInputElement  HTMLAnchorElement   HTMLBodyElement ...

```

Because of this inheritance chain, an `<input>` element has access to:

* Its specific properties (`input.value`, `input.type`) from `HTMLInputElement`
* Element properties (`elem.classList`, `elem.children`) from `Element`
* Node-level properties (`node.parentNode`, `node.nodeType`) from `Node`
* Event capabilities (`elem.addEventListener`) from `EventTarget`

---

### 1. Inspecting Node Type and Tag: `nodeType`, `nodeName`, `tagName`

#### `nodeType`

An integer describing what kind of node it is:

* `1` — Element node (`<div>`, `<p>`)
* `3` — Text node
* `8` — Comment node
* `9` — Document root (`document`)

```javascript
console.log(document.body.nodeType); // 1

```

#### `tagName` vs `nodeName`

Both return the tag/node name, but with a subtle difference:

* **`tagName`** exists **only on `Element` nodes**. In HTML documents, it always returns the uppercase tag name (e.g., `"DIV"`, `"BUTTON"`). On text/comment nodes, it returns `undefined`.
* **`nodeName`** is defined on **all `Node` types**. For elements, it behaves like `tagName` (`"DIV"`). For non-elements, it returns special strings like `"#text"` or `"#comment"`.

```javascript
const commentNode = document.body.firstChild; // Assuming a comment is first
console.log(commentNode.tagName);  // undefined
console.log(commentNode.nodeName); // "#comment"

```

---

### 2. Content Properties: `innerHTML`, `outerHTML`, `textContent`

#### `innerHTML`

Reads or writes HTML markup inside an element.

* When reading: Returns the HTML string inside the element.
* When writing: **Completely wipes out existing children** and parses the incoming string into brand-new DOM nodes.

```javascript
const box = document.querySelector('.box');
box.innerHTML = '<strong>Bold text</strong>';

```

#### `outerHTML`

Includes the element itself along with its inner contents.

* **Gotcha on write:** Writing to `elem.outerHTML` does *not* mutate the variable reference `elem`. It replaces `elem` in the live DOM with new nodes, but `elem` still retains its old element reference detached from the document!

```javascript
const p = document.querySelector('p');
p.outerHTML = '<div>New div</div>';

console.log(p.outerHTML); // Still prints "<p>...</p>"!
// 'p' was replaced in the document, but the JS variable 'p' didn't change.

```

#### `textContent`

Provides access strictly to the raw text inside an element, stripping all markup tags.

* When reading: Concatenates text from all descendant text nodes.
* When writing: Treats the entire input string as literal text. Characters like `<` and `>` are escaped automatically, not parsed as HTML.

```javascript
const box = document.querySelector('.box');
box.textContent = '<b>Not bold</b>';
// Visually displays: "<b>Not bold</b>" (safe from XSS)

```

#### `nodeValue` / `data`

Properties found on non-element nodes (like Text or Comment nodes). `elem.innerHTML` is undefined on a comment or text node, but `.data` allows you to read or edit its literal string.

```javascript
const comment = document.body.firstChild;
console.log(comment.data); // Content of the comment
comment.data = "Updated comment text";

```

---

#### 3. The `hidden` Property

A native HTML5 property present on all `HTMLElement` objects.

* Specifying `elem.hidden = true` is technically equivalent to adding the CSS rule `display: none !important` (unless overridden by explicit CSS rules with higher specificity).

```javascript
const alertBanner = document.querySelector('.banner');
alertBanner.hidden = true;  // Hides element
alertBanner.hidden = false; // Displays element

```

---

### When to Use

* **`textContent`:** Default choice for injecting dynamic text (usernames, comments, search queries). Fast, safe, and immune to Cross-Site Scripting (XSS).
* **`innerHTML`:** Use strictly when injecting structured HTML that has already been sanitized by an HTML sanitizer library (e.g., DOMPurify).
* **`data`:** Use in custom template engines or virtual DOM implementations where text/comment placeholders are manipulated directly.
* **`hidden`:** Great for quick visibility toggles without needing custom CSS utility classes.

---

### Production-Level Tips & Tricks

**1. The `innerHTML += ...` Performance and State Disaster**
Never append items using `elem.innerHTML += '<div>...</div>'`.
Under the hood, this does not "append." It performs a full read-reparse-rewrite:

1. Reads the old HTML into a string.
2. Concatenates the new string.
3. Wipes out the entire inner DOM tree.
4. Reparses and recreates all nodes from scratch.

*Consequence:* All existing sub-elements lose their active state (focused inputs lose focus, video elements restart, form inputs clear values, and attached event listeners added via `addEventListener` are destroyed).
*Fix:* Use `elem.insertAdjacentHTML('beforeend', '<div>...</div>')` or `elem.append()`.

**2. `textContent` vs `innerText` Performance Profile**

* `textContent` reads the raw text nodes directly from memory without considering styles.
* `innerText` triggers a synchronous **reflow / layout computation**. It checks whether CSS hides the element (`display: none`, `visibility: hidden`), strips hidden text, and converts `<br>` to newlines.
Calling `innerText` inside a loop will repeatedly thrash the browser's layout engine, causing noticeable frame drops. Always prefer `textContent` unless you explicitly require styling-aware text extraction.

**3. `hidden` Gotcha: CSS Specificity Override**
If an element has an explicit CSS display rule, `hidden` can fail silently:

```css
.card {
  display: flex; /* Overrides the default [hidden] { display: none; } browser stylesheet */
}

```

```javascript
card.hidden = true; // Still visible because display: flex wins specificity!

```

*Fix:* If using `hidden` universally, ensure your global CSS includes:

```css
[hidden] {
  display: none !important;
}

```

---


## Attributes & Properties

When the browser loads an HTML page, it parses HTML tags and text to create DOM nodes. In this process, **HTML attributes** written in the markup become **properties** on the corresponding JavaScript DOM objects.

However, **HTML Attributes** and **DOM Properties** are not the same thing, and confusing them causes subtle production bugs.

```
 HTML Markup:  <input id="user" type="text" value="Alice">
                      │           │            │
                      ▼           ▼            ▼
                   (HTML Attributes - Strings in HTML source)
                      │
                      ▼ (Parsed into DOM Node)
                      │
 JS DOM Object: { id: "user", type: "text", value: "Alice" }
                   ▲           ▲            ▲
                   │           │            │
                   (DOM Properties - Standard JS Object fields)

```

---

### 1. DOM Properties vs. HTML Attributes

| Feature | HTML Attributes | DOM Properties |
| --- | --- | --- |
| **Where they live** | Written directly in the HTML source | Living properties on the DOM JavaScript object |
| **Data types** | **Always strings** | Can be boolean, number, object, string, etc. |
| **Case sensitivity** | **Case-insensitive** (`ID`, `id`, `Id` are identical) | **Case-sensitive** (`elem.id` works, `elem.ID` is undefined) |
| **Access methods** | `elem.getAttribute(name)`, `elem.setAttribute(name, value)` | Direct dot notation: `elem.property` |
| **Other methods** | `hasAttribute(name)`, `removeAttribute(name)`, `attributes` | `delete elem.property` (rarely used on native props) |

```javascript
const input = document.querySelector('input');

// Attribute methods (always string)
input.setAttribute('tabindex', '1');
console.log(typeof input.getAttribute('tabindex')); // "string"

// Property access (typed)
console.log(typeof input.tabIndex); // "number"

```

---

### 2. Synchronization: When Do They Sync?

For standard attributes (like `id` or `title`), attributes and properties stay synchronized. When you update one, the other reflects the change:

```javascript
document.body.setAttribute('id', 'main');
console.log(document.body.id); // "main"

document.body.id = 'updated';
console.log(document.body.getAttribute('id')); // "updated"

```

#### The Critical Exception: Form Controls (`value`, `checked`)

For `<input>` fields, synchronization is **one-way only** and breaks once the user interacts with the element:

* `elem.getAttribute('value')` stores the **initial/default** HTML markup value.
* `elem.value` represents the **live, current** user input.
* Updating `elem.value` does **not** alter `elem.getAttribute('value')`.

```javascript
const input = document.querySelector('input'); // <input value="initial">

input.value = "User typed this";

console.log(input.value);                  // "User typed this" (Live state)
console.log(input.getAttribute('value'));  // "initial" (Markup default untouched)

```

#### The URL Exception: `href` and `src`

* `getAttribute('href')` returns the exact string written in the HTML (even if relative, e.g., `"/about"`).
* `elem.href` returns the **fully resolved absolute URL** (e.g., `"[https://example.com/about](https://example.com/about)"`).

---

### 3. Non-Standard Attributes and `dataset`

If you place custom attributes on HTML elements to store metadata, HTML5 reserves the `data-*` prefix for this purpose.

All attributes starting with `data-` are collected into the `dataset` property on the DOM element. The property names are converted from kebab-case to camelCase:

```html
<div id="order" data-order-id="12345" data-user-status="pending-review"></div>

```

```javascript
const order = document.getElementById('order');

// Reading dataset (kebab-case becomes camelCase)
console.log(order.dataset.orderId);    // "12345"
console.log(order.dataset.userStatus); // "pending-review"

// Writing dataset updates the DOM attribute in real time
order.dataset.userStatus = "completed";
console.log(order.getAttribute('data-user-status')); // "completed"

```

---

### When to Use

* **DOM Properties (`elem.prop`):** Standardize on this for 95% of everyday operations. Use them to read and manipulate live state: `input.value`, `checkbox.checked`, `elem.id`, `button.disabled`.
* **Attributes (`getAttribute` / `setAttribute`):**
* When you explicitly need to read original/default markup values (e.g., checking if a form is dirty compared to its initial state).
* When working with non-standard attributes that don't map to JavaScript properties.
* Setting SVG attributes (SVG elements often require `setAttribute` or `setAttributeNS` rather than standard dot properties).


* **`dataset`:** For passing metadata from HTML templates (e.g., SSR templates like Blade, Django, Next.js HTML) down into client-side event handlers without polluting global state.

---

### Production-Level Tips & Tricks

**1. Boolean Attributes Trap (`disabled`, `hidden`, `checked`)**
In HTML, a boolean attribute is considered `true` if it is physically present in the tag, regardless of its string content.

```html
<button disabled="false">Click</button> <!-- STILL DISABLED! -->

```

```javascript
const btn = document.querySelector('button');

// Testing with getAttribute can mislead you:
if (btn.getAttribute('disabled')) {
  // Runs! Because getAttribute returns "false" (a non-empty string is truthy in JS)
}

// ALWAYS use property access for boolean states:
if (btn.disabled) {
  // Correctly checks the true boolean state
}

// To re-enable using attributes, you must REMOVE it entirely:
btn.removeAttribute('disabled');
// Or simply via property:
btn.disabled = false;

```

**2. Form Reset Mechanics**
When a form fires `form.reset()`, the browser does not clear inputs to blank strings. It sets each input's `value` property back to whatever is stored in its `value` **attribute**. If you dynamically pre-populate forms via JavaScript and want `reset()` to revert to that dynamic baseline, update both:

```javascript
input.value = "New Default";
input.setAttribute('value', "New Default");

```

**3. Dataset Performance in Hot Loops**
While `elem.dataset` is convenient, accessing it creates a Proxy-like wrapper object behind the scenes that maps kebab-case to camelCase. In tight loops (e.g., iterating through a 10,000-row table or animation frames), `elem.getAttribute('data-id')` is measurably faster than `elem.dataset.id`.

**4. CSS Styling Hooks via Attributes vs Data Attributes**
Targeting custom attributes in CSS allows you to manage UI states cleanly:

```css
/* Clean component states using data attributes */
.btn[data-loading="true"] {
  pointer-events: none;
  opacity: 0.6;
}

```

```javascript
// Toggle state with pure property assignment
btn.dataset.loading = "true";

```

---

## Modifying the Document


---

## Styles & Classes

---


## Element Size & Scrolling

---

## Window Size & Scrolling

----


## Coordinates

---

**Go to Top** [>>>](#document)
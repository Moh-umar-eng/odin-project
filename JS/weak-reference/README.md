# Weak Reference

A **Weak Reference** is a reference to an object that **does not prevent that object from being reclaimed by the garbage collector (GC)**.

In standard JavaScript, holding a normal ("strong") reference keeps an object alive in memory indefinitely. A weak reference lets you point to an object without keeping it alive against its will.

---

### 1. The Core Mental Model: Strong vs. Weak

```
[ Root / Variable ] ──(Strong Reference)──> [ Object in Heap ]  <── Cannot be Garbage Collected

[ Root / Variable ] ···(Weak Reference)····> [ Object in Heap ]  <── Can be Garbage Collected anytime

```

* **Strong Reference:** *"I need this object. Do not delete it as long as I am pointing to it."*
* **Weak Reference:** *"I'd like to use this object if it's still around, but if nothing else needs it, feel free to destroy it."*

---

### 2. JavaScript's Weak Reference Toolkit

JavaScript provides three main constructs for dealing with weak references:

| Construct | Key / Value Behavior | Iteration | Use Case |
| --- | --- | --- | --- |
| **`WeakMap`** | Keys are held weakly; values strongly | Not iterable (no `.size`, `.keys()`) | Associating private data or metadata with objects |
| **`WeakSet`** | Elements are held weakly | Not iterable | Tagging / marking objects (e.g., "is processed") |
| **`WeakRef`** | Direct weak reference to a single target | N/A | Low-level caching, DOM node tracking |
| **`FinalizationRegistry`** | Runs a cleanup callback *after* an object is GC'd | N/A | Resource cleanup (closing handles, logging) |

> **Crucial Rule:** Weak references can **only target objects** (and registered symbols in modern JS), never primitives. Primitives are not garbage-collected entities in the heap; they are values.

---

### 3. Deep Dive: `WeakMap`

A standard `Map` holds strong references to its keys:

```javascript
let cache = new Map();
let user = { id: 101, name: "Alice" };

cache.set(user, "user_metadata");

user = null; // We cut the primary reference!

// But { id: 101 } CANNOT be garbage collected because `cache` still strongly holds the key.

```

With `WeakMap`, when `user = null` is run, the `{ id: 101 }` object becomes eligible for garbage collection. Once collected, its entry in the `WeakMap` disappears automatically:

```javascript
const metadata = new WeakMap();

let session = { sessionId: "xyz-789" };
metadata.set(session, { role: "admin", ip: "192.168.1.1" });

console.log(metadata.get(session)); // { role: "admin", ... }

session = null; 
// Now { sessionId: "xyz-789" } will be removed by GC.
// The entry inside `metadata` is automatically cleaned up.

```

#### Why `WeakMap` is not iterable

You cannot do `for (let key of weakMap)` or read `weakMap.size`. Because garbage collection is non-deterministic (it depends on the engine's internal schedule), the number of items in a `WeakMap` could change from one microsecond to the next. Exposing iteration would leak engine-level GC timing into JavaScript code.

---

### 4. Direct Weak References: `WeakRef`

Introduced in ES2021, `WeakRef` lets you create an explicit, standalone weak reference to an object.

You access the underlying object using the `.deref()` method:

* If the object is still alive in memory, `.deref()` returns the **object**.
* If the object has been garbage collected, `.deref()` returns **`undefined`**.

```javascript
let heavyAsset = { buffer: new ArrayBuffer(1024 * 1024 * 50) }; // 50MB

// Create a weak reference to heavyAsset
const ref = new WeakRef(heavyAsset);

// Read it while it's still alive:
console.log(ref.deref()); // { buffer: ArrayBuffer(...) }

heavyAsset = null; // Release the strong reference

// At some future time after GC runs:
// console.log(ref.deref()); // undefined

```

---

### 5. Cleaning Up: `FinalizationRegistry`

`FinalizationRegistry` lets you register a callback that will be triggered when an object has been garbage collected:

```javascript
// 1. Create the registry with a cleanup callback
const registry = new FinalizationRegistry((heldValue) => {
  console.log(`Resource [${heldValue}] was garbage collected!`);
});

let tempElement = { id: "banner-ad" };

// 2. Register an object to watch, along with a metadata identifier
registry.register(tempElement, "BannerAd_Token_44");

tempElement = null; // Eligible for GC

// When the engine eventually runs GC, it will log:
// "Resource [BannerAd_Token_44] was garbage collected!"

```

> **Warning:** Never rely on `FinalizationRegistry` for critical business logic (like closing database connections or committing financial transactions). Engines do not guarantee *when*—or even *if*—GC callbacks will run (for instance, if the browser tab closes first).

---

### 6. Real-World Use Cases

#### A. DOM Node Metadata Tracking (Avoiding Leaks in SPAs)

When building custom UI libraries or directives, you often need to attach state (like tooltips or event observers) to DOM nodes.

```javascript
const tooltipCache = new WeakMap();

function attachTooltip(domNode, text) {
  tooltipCache.set(domNode, { text, visible: false });
}

// When a framework (like React or Vue) removes `domNode` from the document,
// the memory allocated in `tooltipCache` is freed automatically.

```

#### B. Ephemeral Caches with `WeakRef`

For high-memory assets (parsed images, compiled schemas, large JSON objects):

```javascript
class ImageCache {
  constructor() {
    this.cache = new Map();
  }

  set(id, imageObj) {
    // Store key -> WeakRef(imageObj)
    this.cache.set(id, new WeakRef(imageObj));
  }

  get(id) {
    const ref = this.cache.get(id);
    if (!ref) return null;

    const cachedImage = ref.deref();
    if (cachedImage) {
      return cachedImage; // Cache hit
    }

    // Cache miss (was garbage collected)
    this.cache.delete(id);
    return null;
  }
}

```

---

### Summary Rules of Thumb

1. **Need to associate private data or state with objects?** Use `WeakMap`.
2. **Need to track uniqueness/tags on objects?** Use `WeakSet`.
3. **Need an opportunistic memory cache?** Use `WeakRef` combined with a standard map.
4. **Never rely on weak references for program correctness.** Code should produce the correct result regardless of whether GC happened early, late, or not at all.
# Finilization Registry

A **`FinalizationRegistry`** (introduced in ES2021 alongside `WeakRef`) lets you register an object and run a cleanup callback **after that object has been reclaimed by the garbage collector (GC)**.

Before `FinalizationRegistry`, JavaScript provided no built-in way to know when an object had actually been destroyed in memory.

---

### 1. The Core Mental Model: Post-Mortem Cleanup

A `FinalizationRegistry` does **not** prevent garbage collection. It sits in the background, watches an object, and when the engine's garbage collector finally frees that object, it runs a callback with a token of metadata you provided called the **held value**.

```
[ Target Object ] ──(GC collects object)──> [ Memory Freed ]
                                                   │
                                                   ▼
                                       Registry triggers callback
                                      cleanupCallback(heldValue)

```

> **Key Rule:** The cleanup callback receives the **`heldValue`**, **never the target object itself**. Passing the target object to the callback would resurrect it from the dead, defeating the entire purpose of garbage collection.

---

### 2. Syntax and Basic Workflow

Using a registry involves three steps:

1. **Instantiate** the registry with a cleanup callback.
2. **Register** a target object alongside its metadata (`heldValue`).
3. (Optional) Provide an **unregister token** so you can cancel cleanup if needed.

```javascript
// Step 1: Create the registry
const registry = new FinalizationRegistry((heldValue) => {
  console.log(`Resource [${heldValue}] was garbage collected!`);
});

// Step 2: Register a target
let session = { id: "sess_99182", active: true };

// registry.register(target, heldValue, [unregisterToken])
registry.register(session, "sess_99182");

// Step 3: Remove strong reference to make it eligible for GC
session = null;

// Later, when the JS engine runs a GC cycle:
// Console logs: "Resource [sess_99182] was garbage collected!"

```

---

### 3. Canceling a Watcher: The Unregister Token

If an object is closed or cleaned up manually before GC occurs, you don't want the registry's callback to run redundantly later. You can pass a third argument to `.register()` as an **unregister token** (which must be an object or registered symbol):

```javascript
const fileRegistry = new FinalizationRegistry((descriptor) => {
  console.log(`Auto-closing file descriptor: ${descriptor}`);
});

class ManagedFile {
  constructor(filePath, fd) {
    this.filePath = filePath;
    this.fd = fd;

    // Use 'this' as the unregister token
    fileRegistry.register(this, this.fd, this);
  }

  // Manual cleanup method
  close() {
    console.log(`Manually closing file descriptor: ${this.fd}`);
    // Cancel the background registry listener:
    fileRegistry.unregister(this);
  }
}

let file = new ManagedFile("/var/log/app.log", 4);

// Case A: Developer manually closes it
file.close(); // "Manually closing file descriptor: 4"
file = null;  
// When GC collects it, the registry callback will NOT fire.

```

---

### 4. Real-World Production Patterns

#### A. WebAssembly (Wasm) & Native Memory Deallocation

JavaScript handles its own memory automatically, but languages compiled to WebAssembly (C, C++, Rust) or native Node.js C++ addons manage their own heap manually via `malloc` / `free`.

If a JavaScript wrapper object wrapping a Wasm memory buffer is garbage collected, the underlying Wasm memory will leak unless freed:

```javascript
// Suppose wasmExports.freeBuffer releases raw C++ heap memory
const wasmCleaner = new FinalizationRegistry((wasmPointer) => {
  console.log(`Freeing native Wasm buffer at address: ${wasmPointer}`);
  wasmExports.freeBuffer(wasmPointer);
});

class NativeBufferWrapper {
  constructor(size) {
    // Allocate in WebAssembly linear memory
    this.ptr = wasmExports.allocateBuffer(size);

    // If this JS wrapper gets collected, make sure native memory is freed
    wasmCleaner.register(this, this.ptr, this);
  }

  destroy() {
    wasmCleaner.unregister(this);
    wasmExports.freeBuffer(this.ptr);
  }
}

```

#### B. Cache Eviction Cleanup (Combining `WeakRef` + `FinalizationRegistry`)

When implementing memory-sensitive caches, you can combine `WeakRef` with `FinalizationRegistry` so the cache keys automatically clean themselves up once their values disappear:

```javascript
class AutoCleaningCache {
  #cache = new Map();
  #registry;

  constructor() {
    this.#registry = new FinalizationRegistry((key) => {
      // The cached object was collected; remove the dead key entry
      console.log(`Key "${key}" dereferenced from memory. Evicting from cache Map.`);
      this.#cache.delete(key);
    });
  }

  set(key, value) {
    this.#cache.set(key, new WeakRef(value));
    // Register the value to watch; pass the key as the heldValue
    this.#registry.register(value, key);
  }

  get(key) {
    const ref = this.#cache.get(key);
    return ref ? ref.deref() : undefined;
  }
}

```

---

### 5. Critical Constraints and Common Pitfalls

#### 1. The "Held Value" Trap (Accidental Strong References)

Never pass an object as the `heldValue` if it has a closure or reference back to the `target`. If the held value points to the target, it creates a strong reference that **prevents the target from ever being garbage collected**:

```javascript
// DANGEROUS:
function watchBad(target) {
  // Bad! The heldValue holds target.id, but if heldValue was an object
  // closing over 'target', target will never be freed!
  registry.register(target, { getTargetId: () => target.id }); // LEAK!
}

// SAFE:
function watchGood(target) {
  // Pass a primitive (string, number) or an isolated snapshot object:
  registry.register(target, target.id);
}

```

#### 2. Non-Deterministic Timing (Never Use for Critical Logic)

Garbage collection timing is entirely up to the browser engine or Node.js runtime:

* The callback might run seconds later, minutes later, or **never**.
* If a user closes the browser tab or kills the Node.js process, callbacks are discarded.
* **Do not use it for:** Database transactions, auth token invalidation, persisting files to disk, or network socket termination.
* **Only use it for:** Secondary fallbacks (e.g., freeing auxiliary unmanaged memory if the caller forgot to call `.close()`).

---

### Comparison: `WeakRef` vs. `FinalizationRegistry`

| Feature | `WeakRef` | `FinalizationRegistry` |
| --- | --- | --- |
| **Timing** | *Before* or *during* life of the object | *After* the object has been destroyed |
| **Object Access** | Can access the target via `.deref()` | Cannot access the target; only sees `heldValue` |
| **Primary Role** | Read an object without keeping it alive | Run side effects/cleanup when an object dies |
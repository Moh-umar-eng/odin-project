# JavaScript Objects

### Table of Content

- [Overview of Objects](#overview-of-js-objects)
- [Object Flags Properties](#object-flag-properties)
- [Prodection Level usecase of Flags](#object-flags-in-production)

**No Idea What's Object then visit :** [Object from Scratch](./basics.md)

## Overview of JS Objects

A **JavaScript object** is a collection of **key-value pairs** used to represent a real-world entity or a group of related data.

Think of an object as a **container that stores information about something**.

### Example

```javascript
const user = {
    name: "Umar",
    age: 25,
    city: "Nanded"
};
```

Here:

* `name`, `age`, `city` → **properties (keys)**
* `"Umar"`, `25`, `"Nanded"` → **values**

### Accessing Object Properties

```javascript
console.log(user.name);
console.log(user["age"]);
```

Output:

```text
Umar
25
```

### Object with a Function

An object can also contain functions. A function inside an object is called a **method**.

```javascript
const user = {
    name: "Umar",

    greet: function() {
        console.log("Hello!");
    }
};

user.greet();
```

### Simple Mental Model

```text
Object
 ├── Properties → data
 │    ├── name → "Umar"
 │    └── age  → 25
 │
 └── Methods → behavior
      └── greet() → "Hello!"
```


## Object Flag Properties

In JavaScript, object properties aren't just key-value pairs. Under the hood, each property comes with internal attributes called **property descriptors** or **property flags**. These control how a property behaves when modified, looped over, or deleted.

---

### The Three Core Flags

Beyond the `value`, a standard data property has three boolean flags:

| Flag | Default (Literal/Assignment) | Default (`defineProperty`) | Behavior when `false` |
| --- | --- | --- | --- |
| **`writable`** | `true` | `false` | Read-only. Its `value` cannot be reassigned. |
| **`enumerable`** | `true` | `false` | Hidden from loops (`for...in`) and `Object.keys()`. |
| **`configurable`** | `true` | `false` | Cannot be deleted; flags cannot be altered (one-way street). |

> **Critical Gotcha:** When you create a property using standard assignment (`obj.prop = 1`), all three flags default to `true`. When you create a property using `Object.defineProperty()`, all omitted flags default to `false`.

---

### Inspecting Flags: `getOwnPropertyDescriptor`

Use `Object.getOwnPropertyDescriptor(obj, propName)` to view the flags of a specific property:

```javascript
const user = { name: "Alice" };

console.log(Object.getOwnPropertyDescriptor(user, "name"));
// Output:
// {
//   value: "Alice",
//   writable: true,
//   enumerable: true,
//   configurable: true
// }

```

---

### Modifying Flags: `defineProperty`

Use `Object.defineProperty(obj, propName, descriptor)` to set custom behaviors.

#### 1. `writable: false` (Read-Only)

```javascript
const user = {};

Object.defineProperty(user, "id", {
  value: 101,
  writable: false,
  enumerable: true,
  configurable: true,
});

user.id = 999; // Fails silently in non-strict mode; throws TypeError in 'use strict'
console.log(user.id); // 101

```

#### 2. `enumerable: false` (Hidden from Iteration)

Useful for internal metadata that shouldn't appear in serialization or iteration:

```javascript
const car = { make: "Toyota", model: "Corolla" };

Object.defineProperty(car, "secretToken", {
  value: "xyz-123",
  enumerable: false,
});

console.log(Object.keys(car)); // ['make', 'model'] - 'secretToken' is skipped
console.log(JSON.stringify(car)); // '{"make":"Toyota","model":"Corolla"}'

// Direct access still works:
console.log(car.secretToken); // 'xyz-123'

```

#### 3. `configurable: false` (Locked Permanently)

When `configurable` is set to `false`:

* You cannot delete the property with `delete obj.prop`.
* You cannot change `enumerable` or `configurable`.
* You **cannot** change `writable` from `false` to `true` (you can only flip it from `true` to `false` once).

```javascript
const config = {};

Object.defineProperty(config, "apiKey", {
  value: "SUPER_SECRET",
  writable: false,
  configurable: false,
});

delete config.apiKey; // Fails (TypeError in 'use strict')
console.log(config.apiKey); // 'SUPER_SECRET'

// Attempting to reconfigure:
Object.defineProperty(config, "apiKey", { writable: true }); 
// Uncaught TypeError: Cannot redefine property: apiKey

```

---

### Batch Configuration: `defineProperties`

To configure multiple properties at once:

```javascript
const item = {};

Object.defineProperties(item, {
  name: { value: "Widget", writable: true, enumerable: true },
  id: { value: "A-99", writable: false, enumerable: true },
});

```

---

### Object-Level Integrity Methods

JavaScript provides macro-level methods that configure these flags across entire objects:

* **`Object.preventExtensions(obj)`**: Forbids adding new properties.
* **`Object.seal(obj)`**: Forbids adding/removing properties (`configurable: false` for all existing properties). Values can still be updated if `writable: true`.
* **`Object.freeze(obj)`**: Complete lockdown. Sets `configurable: false` and `writable: false` for all properties.


## Object Flags in Production

Here is how property flags solve architecture and security problems in real-world production code.


### Scenario 1: Preventing Sensitive Data Leaks (`enumerable: false`)

**The Problem:**
In web APIs and full-stack applications, models frequently hold both public fields and internal/sensitive metadata (database IDs, password hashes, internal cache counters, or third-party tokens). If a developer accidentally returns the model directly using `res.json(user)` or `JSON.stringify(user)`, hidden fields leak to the client or end up in public logs.

**The Solution:**
Marking properties as non-enumerable hides them from `JSON.stringify()`, `Object.keys()`, `Object.assign()`, and spread operators (`{ ...user }`), while keeping them accessible via direct reference (`user.passwordHash`).

```javascript
class UserAccount {
  constructor(username, email, passwordHash) {
    this.username = username;
    this.email = email;

    // Attach sensitive data directly, but make it non-enumerable
    Object.defineProperty(this, 'passwordHash', {
      value: passwordHash,
      enumerable: false, // Omitted from JSON serialization and Object.keys()
      writable: false,   // Prevent accidental tampering
      configurable: false
    });
  }
}

const user = new UserAccount("dev_alex", "alex@example.com", "$2b$12$e8uq...");

// 1. Serialization skips non-enumerable fields safely:
console.log(JSON.stringify(user)); 
// Output: {"username":"dev_alex","email":"alex@example.com"}

// 2. Direct system access still works fine:
console.log(user.passwordHash); 
// Output: $2b$12$e8uq...

```

---

### Scenario 2: Tamper-Proof Application Config (`writable: false`, `configurable: false`)

**The Problem:**
In large codebases, core runtime configurations (e.g., API base URLs, tenant IDs, feature flags) are loaded once at startup and imported across dozens of modules. A third-party library or an errant utility function like `config.apiUrl = undefined` can silently corrupt state across the entire process.

**The Solution:**
Lock configuration keys permanently. Setting both flags to `false` creates an immutable guarantee that cannot be deleted or re-enabled at runtime.

```javascript
function loadSystemConfig(env) {
  const config = {};

  Object.defineProperties(config, {
    API_BASE: {
      value: env.API_URL || "https://api.production.com",
      writable: false,      // Cannot overwrite value
      configurable: false,  // Cannot delete or re-enable writable
      enumerable: true
    },
    APP_VERSION: {
      value: "2.4.0",
      writable: false,
      configurable: false,
      enumerable: true
    }
  });

  return config;
}

const appConfig = loadSystemConfig(process.env);

// Any attempt to overwrite or delete fails:
appConfig.API_BASE = "http://malicious-redirect.com"; 
delete appConfig.APP_VERSION;

console.log(appConfig.API_BASE);    // https://api.production.com
console.log(appConfig.APP_VERSION); // 2.4.0

```

---

### Scenario 3: Custom Framework Plugins & Base Classes (Non-Enumerable Methods)

**The Problem:**
Framework authors (like ORMs, Vue/React internals, or utility libraries) often need to inject helper methods, hooks, or lifecycle handlers onto consumer objects. If these utility methods are normal enumerable properties, consumer business logic breaks:

* A `for...in` loop over a database row loops over your framework methods.
* Saving an object back to MongoDB or PostgreSQL attempts to write your helper functions as table columns.

**The Solution:**
This is how JavaScript’s own built-in `Array.prototype` methods (like `.map()` or `.push()`) work—they exist on the prototype, but they don't show up in `for...in` loops because they are non-enumerable.

```javascript
class DatabaseModel {
  constructor(attributes) {
    Object.assign(this, attributes);

    // Attach ORM tracking state without polluting database payload
    Object.defineProperty(this, '_dirtyFields', {
      value: new Set(),
      enumerable: false, // Won't show up in database INSERT/UPDATE loops
      writable: true,
      configurable: false
    });
  }

  save() {
    // Only sends raw user attributes, completely skipping '_dirtyFields'
    const payload = {};
    for (const key in this) {
      payload[key] = this[key];
    }
    return dbClient.query("INSERT", payload);
  }
}

```

---

### Quick Selection Guide for Real Projects

* **Protecting secrets during serialization:** Use `enumerable: false`.
* **Constants and singleton references:** Use `writable: false`.
* **Guardrails against monkey-patching or `delete`:** Use `configurable: false`.
* **Whole-object security:** Use `Object.freeze()` (freezes all keys to `writable: false` and `configurable: false`).
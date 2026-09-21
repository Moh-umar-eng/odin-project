# Proxy & Reflect

### Table of Content

- [What is Proxy?](#what-is-proxy)
- [Runtime Validation](#pattern-a-runtime-type-validation--schema-enforcement)
- [Array -1 Example](#pattern-b-python-style-negative-array-indexing)
- [Reactive System Example](#pattern-c-reactivity-systems-how-vue-3-works)

## What is Proxy?

A **`Proxy`** in JavaScript wraps an existing object (the target) and intercepts its fundamental operations—such as property lookup, assignment, enumeration, function invocation, and deletion.

It allows you to implement custom behavior whenever someone interacts with that object.

---

### 1. The Anatomy of a Proxy

A `Proxy` constructor takes two arguments:

```javascript
const proxy = new Proxy(target, handler);

```

* **`target`**: The original object, array, or function you want to wrap.
* **`handler`**: An object containing "traps" (methods that intercept operations).
* **Traps**: Methods inside the handler that match internal JavaScript operations (e.g., `get`, `set`, `has`, `deleteProperty`).

If a trap is not defined in the handler, the operation falls straight through to the `target` unchanged.

```javascript
const target = { message: "Hello, world!" };

const handler = {
  get(target, prop, receiver) {
    if (prop in target) {
      return target[prop];
    }
    return `Property "${String(prop)}" does not exist!`;
  }
};

const proxy = new Proxy(target, handler);

console.log(proxy.message); // "Hello, world!"
console.log(proxy.missing); // "Property "missing" does not exist!"

```

---

### 2. The `Reflect` API: The Proxy's Twin

Whenever you write a trap, you should generally delegate the default operation to the built-in **`Reflect`** object.

`Reflect` has exact 1:1 matching methods for every proxy trap (`Reflect.get`, `Reflect.set`, etc.). Using `Reflect` ensures edge cases—like proper binding of `this` via the `receiver` argument when getters/setters are involved—work as expected:

```javascript
const handler = {
  get(target, prop, receiver) {
    console.log(`Reading: ${String(prop)}`);
    // Pass execution to the default engine behavior safely
    return Reflect.get(target, prop, receiver);
  },
  set(target, prop, value, receiver) {
    console.log(`Setting: ${String(prop)} = ${value}`);
    return Reflect.set(target, prop, value, receiver); // returns boolean (true on success)
  }
};

```

---

### 3. Common Traps Reference

| Trap | Intercepted Operation | Example Trigger |
| --- | --- | --- |
| **`get(target, prop, receiver)`** | Reading a property | `proxy.foo`, `proxy['foo']` |
| **`set(target, prop, val, receiver)`** | Writing a property | `proxy.foo = 10` |
| **`has(target, prop)`** | The `in` operator | `'foo' in proxy` |
| **`deleteProperty(target, prop)`** | Property deletion | `delete proxy.foo` |
| **`apply(target, thisArg, args)`** | Function call | `proxyFunction(...args)` |
| **`construct(target, args, newTarget)`** | `new` instantiation | `new proxyConstructor(...)` |
| **`ownKeys(target)`** | Key enumeration | `Object.keys(proxy)`, `for..in` |

---

### 4. Real-World Production Patterns

#### Pattern A: Runtime Type Validation & Schema Enforcement

JavaScript doesn't enforce property types at runtime. A proxy can act as an active validation guard:

```javascript
const userSchema = {
  age: (val) => typeof val === "number" && val >= 0 && val <= 120,
  email: (val) => typeof val === "string" && val.includes("@"),
};

function createValidatedUser(data) {
  return new Proxy(data, {
    set(target, prop, value, receiver) {
      const validator = userSchema[prop];
      if (validator && !validator(value)) {
        throw new TypeError(`Invalid assignment for "${prop}": ${value}`);
      }
      return Reflect.set(target, prop, value, receiver);
    }
  });
}

const user = createValidatedUser({ age: 25, email: "alex@example.com" });

user.age = 30; // Works fine
// user.age = -5; // Throws TypeError: Invalid assignment for "age": -5
// user.email = 12345; // Throws TypeError: Invalid assignment for "email": 12345

```

#### Pattern B: Python-Style Negative Array Indexing

By default, `arr[-1]` in JavaScript returns `undefined`. A proxy can intercept negative numbers and calculate the offset from the end:

```javascript
function createNegativeArray(...items) {
  return new Proxy(items, {
    get(target, prop, receiver) {
      const index = Number(prop);
      if (Number.isInteger(index) && index < 0) {
        // -1 maps to items.length - 1
        prop = String(target.length + index);
      }
      return Reflect.get(target, prop, receiver);
    }
  });
}

const list = createNegativeArray("first", "middle", "last");
console.log(list[-1]); // "last"
console.log(list[-2]); // "middle"

```

#### Pattern C: Reactivity Systems (How Vue 3 Works)

Modern reactive frameworks use proxies to trigger UI updates or side effects whenever data changes:

```javascript
function reactive(obj, onChange) {
  return new Proxy(obj, {
    set(target, prop, value, receiver) {
      const oldValue = target[prop];
      const success = Reflect.set(target, prop, value, receiver);
      if (success && oldValue !== value) {
        onChange(prop, value); // Notify subscribers / trigger re-render
      }
      return success;
    }
  });
}

const state = reactive({ count: 0 }, (key, val) => {
  console.log(`[DOM Update]: Key "${key}" changed to ${val}`);
});

state.count = 1; // Logs: [DOM Update]: Key "count" changed to 1
state.count = 2; // Logs: [DOM Update]: Key "count" changed to 2

```

---

### 5. Revocable Proxies

If you need to grant a third-party library or untrusted module temporary access to an object, you can create a proxy that can be permanently disabled:

```javascript
const secretData = { token: "ghp_12345SECRET" };

const { proxy, revoke } = Proxy.revocable(secretData, {
  get(target, prop) {
    return target[prop];
  }
});

console.log(proxy.token); // "ghp_12345SECRET"

// Revoke access when operation completes:
revoke();

// Any future access throws an error:
console.log(proxy.token); // TypeError: Cannot perform 'get' on a proxy that has been revoked

```

---

### 6. Limitations and Gotchas

1. **`this` Identity Discrepancy:** Inside methods on the target, `this` becomes the `proxy`, not the `target`. If the target relies on private fields (`#privateField`) or built-in internal slots (e.g., `Map.prototype.get`, `Date.prototype.getTime`), calling them through a plain proxy without rebinding will throw a `TypeError: Method Map.prototype.get called on incompatible receiver`.
2. **Performance Overhead:** Traps add overhead to property lookups and writes. While fast in modern engines, wrapping tight performance loops in complex proxies can degrade optimization.

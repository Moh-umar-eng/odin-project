# Reference Type

In JavaScript, values are divided into two fundamental categories: **Primitive Types** and **Reference Types**.

The distinction comes down to **how they are stored in memory** and **how they are passed around** in your code.

---

### 1. The Core Mental Model: Value vs. Pointer

| Category | Types | Storage | Assignment Behavior |
| --- | --- | --- | --- |
| **Primitives** | `string`, `number`, `boolean`, `null`, `undefined`, `symbol`, `bigint` | Directly on the **Stack** | Copied by **value** (independent copy) |
| **Reference Types** | `Object`, `Array`, `Function`, `Date`, `Map`, `Set`, `RegExp` | Object lives on the **Heap**; pointer on the **Stack** | Copied by **reference** (shared address) |

```
Stack (Fast, fixed size)            Heap (Dynamic, unstructured)
┌──────────────────────┐            ┌─────────────────────────────┐
│ age = 25             │            │                             │
│ userA = 0x001FF ─────┼───────────>│ { name: "Alice", age: 25 }  │
│ userB = 0x001FF ─────┼───────────>│                             │
└──────────────────────┘            └─────────────────────────────┘

```

When you assign a primitive:

```javascript
let a = 10;
let b = a; // b gets a fresh, isolated copy of 10
b = 20;

console.log(a); // 10 (unchanged)
console.log(b); // 20

```

When you assign a reference type:

```javascript
let userA = { name: "Alice" };
let userB = userA; // userB receives the memory address (pointer) to the same object

userB.name = "Bob";

console.log(userA.name); // "Bob" (mutated via the shared reference!)

```

---

### 2. Equality Comparison (`==` and `===`)

With primitives, equality compares the **actual values**:

```javascript
console.log(5 === 5); // true
console.log("cat" === "cat"); // true

```

With reference types, equality checks **identity in memory** (whether both point to the exact same heap address), not internal contents:

```javascript
const obj1 = { id: 1 };
const obj2 = { id: 1 };
const obj3 = obj1;

console.log(obj1 === obj2); // false (distinct heap objects, different addresses)
console.log(obj1 === obj3); // true  (both hold address pointing to the same object)

console.log([] === []);     // false
console.log({} === {});     // false

```

---

### 3. Function Arguments: Call-by-Sharing

A frequent interview question is: *"Is JavaScript pass-by-value or pass-by-reference?"*

The technical answer: **JavaScript is always pass-by-value**, but when passing a reference type, **the value being passed is the copy of the pointer address**. This is called **call-by-sharing**.

#### Mutating a property changes the outer object:

```javascript
function updateCart(cart) {
  cart.push("Apples"); // Mutates heap contents at the referenced address
}

const myCart = ["Bread"];
updateCart(myCart);
console.log(myCart); // ['Bread', 'Apples']

```

#### Reassigning the parameter breaks the link:

```javascript
function replaceCart(cart) {
  cart = ["Milk", "Eggs"]; // Overwrites local pointer; outer variable is untouched
}

const myCart = ["Bread"];
replaceCart(myCart);
console.log(myCart); // ['Bread']

```

---

### 4. `const` with Reference Types

A common misconception is that declaring an object with `const` makes it immutable.

`const` only locks the **variable binding (the pointer)**, not the **contents inside the heap**:

```javascript
const config = { theme: "dark" };

// Allowed: Mutating heap contents
config.theme = "light";
config.version = "1.0";
console.log(config); // { theme: "light", version: "1.0" }

// Error: Reassigning the pointer to a new memory address
config = { theme: "blue" }; // TypeError: Assignment to constant variable.

```

To prevent property mutations on an object, use `Object.freeze(config)`.

---

### 5. Copying Reference Types (Shallow vs. Deep)

Because assignment only copies pointers, you must explicitly clone objects to avoid accidental side effects.

#### A. Shallow Copy (Copies top-level primitives; leaves nested objects referenced)

* Spread operator: `{ ...obj }` or `[ ...arr ]`
* `Object.assign({}, obj)`
* `arr.slice()`

```javascript
const original = { name: "Alice", details: { city: "London" } };
const shallowCopy = { ...original };

shallowCopy.name = "Bob";
shallowCopy.details.city = "Paris";

console.log(original.name);         // "Alice" (top-level decoupled)
console.log(original.details.city); // "Paris" (nested reference still shared!)

```

#### B. Deep Copy (Recursively clones every nested reference)

* **Modern standard:** `structuredClone(obj)`
* **Legacy hack:** `JSON.parse(JSON.stringify(obj))` (fails on `Date`, `Map`, `Set`, `undefined`, functions, and circular references)

```javascript
const original = { name: "Alice", details: { city: "London" } };
const deepCopy = structuredClone(original);

deepCopy.details.city = "Paris";

console.log(original.details.city); // "London" (completely isolated)

```

---

### 6. Memory Management and Garbage Collection

When a reference type has **zero references** pointing to it from the root scope (global variables, current execution context), the engine's garbage collector flags it and frees its heap memory using the **Mark-and-Sweep** algorithm.

```javascript
let user = { name: "Alice" }; // 1 reference
let admin = user;             // 2 references

user = null;  // Object still retained because 'admin' holds the reference
admin = null; // 0 references -> Object is marked for Garbage Collection

```

> **Preventing Memory Leaks:** If you store references inside global arrays, event listeners, or cache maps without clearing them, the garbage collector cannot free them. Use **`WeakMap`** or **`WeakSet`** when you need references that should not prevent garbage collection.
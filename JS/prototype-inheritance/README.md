# JS Prototype

### Table of Content 

- [What is Prototype?](#overiew-of-prototypes)
- [F.Prototype (Constructor)](#fprototype-constructor)
- [Native Prototype](#native-prototypes)
- [Prototype Methods, Object without `__proto__`](#prototype-methods-object-without-__proto__)

## Overiew of Prototypes 
In JavaScript, **prototypes are the mechanism by which objects inherit features from one another**.

Unlike class-based languages (Java, C++) where classes act as blueprints and objects are copies of that blueprint, JavaScript uses **prototypal inheritance**: objects link directly to other objects.

### 1. The Core Mental Model: The Secret Link

Every JavaScript object has an internal, hidden link to another object called its **prototype**.

When you ask an object for a property or method:

1. JS looks on the **object itself** (own property).
2. If not found, it traverses up to the **object's prototype**.
3. If still not found, it checks the **prototype's prototype**.
4. This lookup continues until it hits `null` (the end of the line). If it's still missing, it returns `undefined`.

This lookup sequence is called the **Prototype Chain**.

```
[myArray] 
   └── [[Prototype]] ──> Array.prototype (contains .push(), .map(), .filter())
                              └── [[Prototype]] ──> Object.prototype (contains .toString(), .hasOwnProperty())
                                                         └── [[Prototype]] ──> null

```

---

### 2. `[[Prototype]]` vs `__proto__` vs `prototype`

This is the single biggest source of confusion in JavaScript. Here is the distinction:

| Term | What it is | Where it lives |
| --- | --- | --- |
| **`[[Prototype]]`** | The actual, internal link pointing to the parent object. | On every object (hidden internal slot). |
| **`__proto__`** | An accessor (getter/setter) exposing `[[Prototype]]`. | On `Object.prototype` (legacy; avoid in modern code). |
| **`Object.getPrototypeOf(obj)`** | The standard, modern way to read an object's prototype. | Method on `Object`. |
| **`Function.prototype`** | An object that becomes the `[[Prototype]]` of instances created via `new Function()`. | Only on **functions**. |

> **Key Rule:** Only **functions** have a `.prototype` property. Plain objects do not have `.prototype`; they have an internal prototype reference (`[[Prototype]]`).

---

### 3. How Prototypes Work in Practice

#### The Problem: Redundant Memory Allocation

If you define methods directly inside a constructor or factory function, every single instance gets its own copy of that function in memory:

```javascript
function User(name) {
  this.name = name;
  // BAD: Every new User recreates this identical function in memory
  this.sayHi = function() {
    console.log(`Hi, I'm ${this.name}`);
  };
}

const user1 = new User("Alice");
const user2 = new User("Bob");
console.log(user1.sayHi === user2.sayHi); // false (two different functions)

```

#### The Solution: Shared Methods via Prototype

By placing shared methods on `ConstructorFunction.prototype`, all instances point to the exact same function in memory:

```javascript
function User(name) {
  this.name = name; // Instance-specific data
}

// Attach method to the prototype object:
User.prototype.sayHi = function() {
  console.log(`Hi, I'm ${this.name}`);
};

const user1 = new User("Alice");
const user2 = new User("Bob");

user1.sayHi(); // "Hi, I'm Alice"
user2.sayHi(); // "Hi, I'm Bob"

console.log(user1.sayHi === user2.sayHi); // true (same memory address!)

```

When `user1.sayHi()` runs:

1. Engine checks `user1` for `sayHi`. Not there.
2. Engine follows `user1`'s prototype link (`Object.getPrototypeOf(user1)`).
3. It finds `User.prototype.sayHi`.
4. It calls `sayHi` with `this` bound to `user1`.

---

### 4. Prototypal Inheritance (Object-to-Object)

You can link objects directly without constructor functions using `Object.create()`:

```javascript
const animal = {
  eats: true,
  walk() {
    console.log("Animal walks");
  }
};

// Create a new object with 'animal' set as its prototype:
const rabbit = Object.create(animal);
rabbit.jumps = true;

rabbit.walk(); // "Animal walks" (delegated to animal)
console.log(rabbit.eats); // true (delegated to animal)
console.log(rabbit.jumps); // true (own property)

```

---

### 5. Property Shadowing

If an object defines a property with the exact same name as one on its prototype, the object's own property **shadows** (overrides) the prototype's property:

```javascript
const vehicle = { wheels: 4 };
const motorcycle = Object.create(vehicle);

motorcycle.wheels = 2; // Shadows 'wheels' on vehicle

console.log(motorcycle.wheels); // 2 (found on motorcycle itself)
console.log(vehicle.wheels);    // 4 (prototype remains untouched)

```

To check whether a property exists directly on the object versus on its prototype chain:

```javascript
// Modern method:
console.log(Object.hasOwn(motorcycle, 'wheels')); // true
console.log(Object.hasOwn(motorcycle, 'toString')); // false (inherited from Object.prototype)

```

---

### 6. How ES6 `class` Syntax Fits In

JavaScript's `class` keyword introduced in ES6 is largely **syntactic sugar** over prototypes. It did not introduce a new object-oriented model.

```javascript
class Dog {
  constructor(name) {
    this.name = name;
  }

  bark() {
    console.log("Woof!");
  }
}

```

Under the hood, the engine translates that to:

1. A constructor function `Dog`.
2. Attaching `bark` to `Dog.prototype.bark`.
3. Setting up constructor bindings.

```javascript
console.log(typeof Dog); // "function"
console.log(Dog.prototype.bark); // [Function: bark]

```

---

#### Summary Checklist

* **Delegation over copying:** Objects do not copy behaviors; they delegate calls up the chain.
* **`Object.prototype`** sits near the root of almost all chains; its prototype is `null`.
* **Performance:** Store data fields on the instance (`this.x = x`), and shared methods on the prototype (`MyClass.prototype.fn = ...`).
* **Inspection tools:** Prefer `Object.getPrototypeOf(obj)` over `obj.__proto__`, and `Object.hasOwn(obj, prop)` over checking truthiness.

## F.Prototype (Constructor)

In JavaScript, **`F.prototype`** refers to the regular property named `"prototype"` on a constructor function `F`.

It has exactly one core responsibility: **when you call `new F()`, the engine assigns whatever object `F.prototype` points to as the hidden `[[Prototype]]` of the newly created instance.**

---

### The Fundamental Mental Model

A function’s `.prototype` property is **not** the function’s own prototype. It is a blueprint object that will become the prototype for **objects created by that function**.

```
[ Constructor F ] 
       │
       └── .prototype ──> [ F.prototype Object ]
                                  ▲
                                  │ (linked via [[Prototype]])
[ instance = new F() ] ───────────┘

```

When you invoke:

```javascript
const obj = new F();

```

The JavaScript engine essentially performs this operation behind the scenes:

```javascript
Object.getPrototypeOf(obj) === F.prototype; // true

```

---

### The Default `F.prototype` and `constructor`

By default, every standard function automatically gets a `.prototype` property created for it. This default object has a single non-enumerable property: **`constructor`**, which points right back to the function itself.

```javascript
function Rabbit() {}

console.log(Rabbit.prototype); 
// { constructor: Rabbit }

console.log(Rabbit.prototype.constructor === Rabbit); // true

```

Because new instances inherit from `Rabbit.prototype`, they also inherit this `constructor` reference:

```javascript
const whiteRabbit = new Rabbit();

console.log(whiteRabbit.constructor === Rabbit); // true

```

This allows you to construct a new object using an existing instance's constructor without referencing the original class name:

```javascript
const blackRabbit = new whiteRabbit.constructor();

```

---

### Adding Methods vs. Overwriting `F.prototype`

How you modify `F.prototype` determines whether that constructor link stays intact.

#### 1. The Safe Way: Add Properties to the Existing Prototype

Add methods onto the default object so `constructor` is preserved:

```javascript
function User(name) {
  this.name = name;
}

// Add to the existing prototype object:
User.prototype.sayHi = function() {
  console.log(`Hello, I am ${this.name}`);
};

const user = new User("Alice");
console.log(user.constructor === User); // true

```

#### 2. The Dangerous Way: Replacing the Entire Prototype

If you overwrite `F.prototype` with a brand new object literal, the default `constructor` property is wiped out:

```javascript
function User(name) {
  this.name = name;
}

// Reassigning to a fresh object:
User.prototype = {
  sayHi() {
    console.log(`Hello, I am ${this.name}`);
  }
};

const user = new User("Alice");
console.log(user.constructor === User); // false!
console.log(user.constructor === Object); // true (falls back to Object.prototype)

```

**How to fix it:** If you must reassign `F.prototype` all at once, manually restore the `constructor` property:

```javascript
User.prototype = {
  constructor: User,
  sayHi() {
    console.log(`Hello, I am ${this.name}`);
  }
};

```

---

### Dynamic Behavior: Mutating vs. Reassigning `F.prototype`

Existing instances hold a **direct reference** to the prototype object that existed at the moment they were created.

#### Case A: Mutating the prototype reflects on existing instances

```javascript
function Dog() {}
const pup = new Dog();

// Modify the existing prototype object:
Dog.prototype.bark = function() {
  console.log("Woof!");
};

pup.bark(); // "Woof!" (works, because pup references that same object)

```

#### Case B: Reassigning the prototype does NOT affect older instances

```javascript
function Cat() {}
const kitty1 = new Cat();

// Completely replace the prototype reference:
Cat.prototype = {
  meow() {
    console.log("Meow!");
  }
};

const kitty2 = new Cat();

kitty2.meow(); // "Meow!"
kitty1.meow(); // TypeError: kitty1.meow is not a function

```

`kitty1` still points to the old, empty prototype object created originally. Only instances created *after* the reassignment receive the new prototype.

---

### Functions That Do NOT Have `F.prototype`

Not all functions have a `.prototype` property:

1. **Arrow Functions:**
```javascript
const add = (a, b) => a + b;
console.log(add.prototype); // undefined
new add(); // TypeError: add is not a constructor

```


2. **Object Method Shorthand:**
```javascript
const obj = {
  greet() {}
};
console.log(obj.greet.prototype); // undefined

```


3. **Built-in methods** like `Math.max` or `parseInt`.

---

### Key Distinctions at a Glance

* **`F.prototype`**: A regular property on constructor functions used strictly as a recipe for `new F()`.
* **`Object.getPrototypeOf(F)`**: The actual prototype of the function itself (which is `Function.prototype`).
* **`Object.getPrototypeOf(instance)`**: The actual prototype of the instance (which matches `F.prototype`).

## Native Prototypes

In JavaScript, **native prototypes** are the built-in prototype objects provided by the runtime environment. Every built-in constructor—such as `Object`, `Array`, `Function`, `String`, `Number`, and `Date`—has a `.prototype` property hosting the standard methods you use every day.

When you write `[1, 2, 3].map(...)` or `"hello".toUpperCase()`, you are delegating directly to a native prototype.

---

### 1. The Built-in Prototype Hierarchy

Whenever you create a literal value (like an array or an object), JavaScript implicitly links its internal `[[Prototype]]` to the corresponding native prototype.

```
                  null
                   ▲
                   │
            Object.prototype  <── (has .toString(), .hasOwnProperty(), etc.)
             ▲           ▲
             │           │
     Array.prototype   Function.prototype
     (has .map(),      (has .call(),
      .filter(), etc.)  .bind(), etc.)
             ▲
             │
      const arr = []

```

You can verify these chain relationships directly in code:

```javascript
const arr = [1, 2, 3];

// arr inherits directly from Array.prototype
console.log(Object.getPrototypeOf(arr) === Array.prototype); // true

// Array.prototype inherits from Object.prototype
console.log(Object.getPrototypeOf(Array.prototype) === Object.prototype); // true

// Object.prototype sits at the top (its prototype is null)
console.log(Object.getPrototypeOf(Object.prototype)); // null

```

---

### 2. Primitives and "Autoboxing"

Primitives (`string`, `number`, `boolean`, `symbol`, `bigint`) are **not** objects. They do not have properties or methods, and they do not have a prototype of their own.

Yet this code works:

```javascript
const str = "hello";
console.log(str.toUpperCase()); // "HELLO"

```

#### How it works under the hood

When you access a property on a primitive, JavaScript performs an invisible process called **autoboxing**:

1. The engine temporarily creates a wrapper object: `new String("hello")`.
2. It executes `String.prototype.toUpperCase` using this temporary object as `this`.
3. It returns the resulting primitive string value.
4. The temporary wrapper object is immediately discarded and garbage collected.

> **Exception:** `null` and `undefined` have **no** wrapper objects and no native prototypes. Attempting to access any property on them throws a `TypeError`.

---

### 3. Modifying Native Prototypes ("Monkey Patching")

Because native prototypes are standard JavaScript objects, they are mutable. You can attach new methods to them, and every instance in your program will instantly inherit them:

```javascript
// Extending String.prototype
String.prototype.toSnakeCase = function() {
  return this.toLowerCase().replace(/\s+/g, '_');
};

console.log("Hello World".toSnakeCase()); // "hello_world"

```

#### Why Monkey Patching is Considered an Anti-Pattern

In production code, modifying native prototypes is strongly discouraged for three reasons:

1. **Namespace Collisions:** If two third-party packages both decide to attach `Array.prototype.flatten`, one will overwrite the other, leading to silent bugs.
2. **Future Compatibility (The "Smooshgate" Lesson):**
In 2018, TC39 wanted to add a `contains` method to `Array.prototype`. However, an older, widely used library called MooTools had already monkey-patched `Array.prototype.contains` with different behavior. Ships and legacy websites broke worldwide. JavaScript was forced to rename the standard method to `Array.prototype.includes`.
3. **Performance:** Modifying built-in prototypes can invalidate inline caches and de-optimize engine hot-paths in engines like V8.

---

### 4. The One Valid Exception: Polyfilling

The only globally accepted reason to modify a native prototype is **polyfilling**—adding an official ECMAScript feature to an older browser engine that lacks it.

A polyfill **must** check for existence first so it never overrides native implementations:

```javascript
// Polyfill Array.prototype.at if missing
if (!Array.prototype.at) {
  Array.prototype.at = function(index) {
    index = Math.trunc(index) || 0;
    if (index < 0) index += this.length;
    if (index < 0 || index >= this.length) return undefined;
    return this[index];
  };
}

```

---

### 5. Method Borrowing

Because native methods reside on prototypes, you can **borrow** them to use on data structures that don't normally have access to them (such as array-like objects like `arguments` or NodeLists):

```javascript
function listArguments() {
  // 'arguments' is an object, not an Array, so it lacks .join()
  // We borrow join directly from Array.prototype:
  const result = Array.prototype.join.call(arguments, ' -> ');
  console.log(result);
}

listArguments("Start", "Middle", "End");
// Output: "Start -> Middle -> End"

```

In modern JavaScript (ES6+), method borrowing is less frequent because `Array.from()` and spread syntax (`[...arguments]`) convert array-likes into actual arrays cleanly, but it remains a foundational pattern in utility libraries and engines.

---

### Native Prototypes Summary Matrix

| Literal Syntax | Native Constructor | Immediate Prototype | Top Prototype |
| --- | --- | --- | --- |
| `{}` | `Object` | `Object.prototype` | `null` |
| `[]` | `Array` | `Array.prototype` | `Object.prototype` |
| `function(){}` | `Function` | `Function.prototype` | `Object.prototype` |
| `"abc"` (boxed) | `String` | `String.prototype` | `Object.prototype` |
| `42` (boxed) | `Number` | `Number.prototype` | `Object.prototype` |
| `true` (boxed) | `Boolean` | `Boolean.prototype` | `Object.prototype` |
| `/pattern/` | `RegExp` | `RegExp.prototype` | `Object.prototype` |


## Prototype Methods, Object without `__proto__`

Modern JavaScript provides explicit utility methods for interacting with an object's prototype directly. These methods replace legacy access patterns and make it possible to create dictionary objects that have no prototype at all.

---

### 1. Modern Prototype Methods

Accessing or mutating `__proto__` directly is deprecated for performance, architectural, and security reasons. Modern JavaScript provides three official methods on `Object`:

| Modern Method | Purpose | Equivalent Deprecated Syntax |
| --- | --- | --- |
| **`Object.getPrototypeOf(obj)`** | Reads an object's prototype. | `obj.__proto__` (getter) |
| **`Object.setPrototypeOf(obj, proto)`** | Mutates an object's prototype. | `obj.__proto__ = proto` (setter) |
| **`Object.create(proto, [descriptors])`** | Creates a new object with the specified prototype. | — |

#### Practical Examples

```javascript
const animal = {
  eats: true
};

// 1. Object.create: create with a specific prototype
const rabbit = Object.create(animal, {
  jumps: { value: true, enumerable: true }
});

// 2. Object.getPrototypeOf: inspect the prototype
console.log(Object.getPrototypeOf(rabbit) === animal); // true
console.log(rabbit.eats); // true

// 3. Object.setPrototypeOf: change prototype dynamically
const machine = { runs: true };
Object.setPrototypeOf(rabbit, machine);

console.log(rabbit.runs); // true
console.log(rabbit.eats); // undefined (link to animal severed)

```

> **Performance Warning on `Object.setPrototypeOf`:** Changing the prototype of an existing object is one of the slowest operations in JavaScript engines (V8, SpiderMonkey). It busts inline caches and deoptimizes property access for that object shape. If you need a custom prototype, assign it at instantiation using `Object.create()`.

---

### 2. What Exactly is `__proto__`?

`__proto__` is **not** an own property on regular objects. It is an **accessor property** (getter/setter) that lives directly on `Object.prototype`:

```javascript
console.log(Object.getOwnPropertyDescriptor(Object.prototype, '__proto__'));
// {
//   get: [Function: get __proto__],
//   set: [Function: set __proto__],
//   enumerable: false,
//   configurable: true
// }

```

When you write `obj.__proto__`:

1. The engine looks for an own property named `"__proto__"` on `obj`.
2. It doesn't find it, so it traverses up the prototype chain to `Object.prototype`.
3. It invokes the getter/setter located on `Object.prototype`.

This brings us to a major historical flaw in JavaScript: **property name collision**.

```javascript
const dictionary = {};
const userInput = "__proto__";

dictionary[userInput] = "malicious_payload";

// It didn't store a key named "__proto__"!
// It invoked Object.prototype's setter and changed the object's prototype chain.
console.log(dictionary[userInput]); // [Object: null prototype] {} or mutated object

```

---

### 3. Objects Without `__proto__` (`Object.create(null)`)

To create an object that has no prototype chain whatsoever, pass `null` to `Object.create`:

```javascript
const bareObj = Object.create(null);

console.log(Object.getPrototypeOf(bareObj)); // null

```

These objects are called **"very plain objects"**, **"bare objects"**, or **"dictionary objects"**.

#### What Happens Inside a Bare Object?

Because a bare object does not inherit from `Object.prototype`, it inherits **no built-in methods or accessors**:

```javascript
const cleanMap = Object.create(null);

// 1. __proto__ behaves as an ordinary data property:
cleanMap.__proto__ = "hello";
console.log(cleanMap.__proto__); // "hello" (just a regular string property!)
console.log(Object.getPrototypeOf(cleanMap)); // null (prototype never changed)

// 2. Standard Object methods are missing:
// cleanMap.toString();        // TypeError: cleanMap.toString is not a function
// cleanMap.hasOwnProperty();  // TypeError: cleanMap.hasOwnProperty is not a function

```

If you need to inspect properties on a bare object, use static `Object` methods rather than instance methods:

```javascript
// BAD: cleanMap.hasOwnProperty("key") -> throws error
// GOOD:
console.log(Object.hasOwn(cleanMap, "__proto__")); // true

```

---

### 4. Real-World Use Cases for Bare Objects

#### A. Safe Dictionaries & Lookup Tables (Pre-ES6 Map)

Before JavaScript introduced the `Map` class, developers used plain `{}` objects as key-value stores. If an external source passed keys like `"toString"` or `"__proto__"`, code would crash or behave unpredictably:

```javascript
// Unsafe with plain literal:
const counts = {};
counts["toString"] = 1;
// If another module runs `counts.toString()`, it throws: "counts.toString is not a function"

// Safe with Object.create(null):
const safeCounts = Object.create(null);
safeCounts["toString"] = 1;
safeCounts["__proto__"] = 5;
// Perfectly isolated key-value storage

```

#### B. Defending Against Prototype Pollution

Prototype pollution happens when an attacker passes a payload containing `__proto__` to a recursive merge/clone function, altering properties on the global `Object.prototype` for all objects in the Node.js or browser process.

Using `Object.create(null)` for temporary hash tables or parsing buffers ensures incoming keys cannot traverse up into `Object.prototype`.

---

### Summary Comparison

| Feature | Standard Object (`{}`) | Bare Object (`Object.create(null)`) | Modern `Map` |
| --- | --- | --- | --- |
| **`[[Prototype]]`** | `Object.prototype` | `null` | `Map.prototype` |
| **`__proto__` behavior** | Invokes getter/setter | Regular data property | Regular property on inner storage |
| **Default methods** | `.toString()`, `.valueOf()`, etc. | None | `.get()`, `.set()`, `.has()`, etc. |
| **Safe for user-supplied keys?** | No (risks collisions/pollution) | Yes | Yes (best modern approach) |

Back to Top : [>>>](#table-of-content)
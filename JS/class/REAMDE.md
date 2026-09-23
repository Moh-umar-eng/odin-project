# Class

### Table of Content

- [What is Class](#what-is-class)
- [Class Inheritance](#class-inheritance)
- [Static Properties & Methods](#static-properties--methods)
- [Private & Public Properites Methods](#private--public-properties-methods)
- [Extending Built in Class](#extending-built-in-class)
- [Class Checking `instanceof`](#class-checking-instanceof)
- [Mixins](#mixins)

## What is Class?

A class in JavaScript is a template for creating objects. While JavaScript remains a prototype-based language under the hood, the `class` syntax introduced in ES6 provides a cleaner, object-oriented way to define constructors and methods.

```javascript
class User {
  // The constructor is called automatically when 'new' is used
  constructor(name) {
    this.name = name;
  }

  // Method (automatically added to User.prototype)
  sayHi() {
    console.log(`Hello, ${this.name}!`);
  }
}

const alice = new User("Alice");
alice.sayHi(); // "Hello, Alice!"

```

### Under the Hood

In JavaScript, a class is essentially a special type of function.

1. The `class User` declaration creates a function named `User`, grabbing the code directly from the `constructor` method.
2. It takes any methods defined inside the block (like `sayHi`) and attaches them to `User.prototype`.

When you call `new User()`, the engine creates a new object, binds `this` to it, runs the constructor, and links the object's prototype to `User.prototype` so it can access the methods.

### When to Use

* **Data Models:** When representing domain entities that require both state (data) and behavior (methods), such as a `User`, `ShoppingCart`, or `GameCharacter`.
* **UI Components:** Abstracting complex UI widgets where you need to manage DOM elements, event listeners, and internal component state together.
* **Service Wrappers:** Encapsulating complex integrations (e.g., an `ApiClient` class that holds auth tokens, base URLs, and standardized fetch methods).

### Production-Level Tips & Tricks

**1. The "Losing `this`" Problem**
If you pass a standard class method as a callback to `setTimeout` or a DOM event listener, it loses its `this` context and resolves to `undefined`.

```javascript
class Button {
  constructor(value) {
    this.value = value;
  }
  click() {
    console.log(this.value);
  }
}

const btn = new Button("Submit");
setTimeout(btn.click, 100); // undefined

```

*Fix:* Use **Class Fields** with arrow functions. Arrow functions do not have their own `this`; they permanently capture the `this` of the class instance when the object is created.

```javascript
class Button {
  value = "Submit"; // Class field (instance property)
  
  click = () => {   // Bound method
    console.log(this.value);
  }
}

```

**2. Implicit Strict Mode**
All code written inside a `class` block automatically runs in strict mode (`"use strict"`). You cannot accidentally use undeclared variables or legacy features inside class methods, which proactively prevents silent errors.

**3. Non-Enumerable Methods**
In older prototype-based JavaScript, if you attached a function to a prototype, it would show up if someone ran a `for...in` loop on your object. Methods declared inside a `class` are implicitly set to `enumerable: false`. If you loop over a class instance, it will only iterate over your data properties, keeping your loops clean from method pollution.

**4. The `new` Requirement**
With old constructor functions, if a developer forgot the `new` keyword, the function would execute normally but attach all its properties to the global object, causing disastrous bugs. Classes explicitly prevent this. Calling a class without `new` immediately throws a `TypeError: Class constructor cannot be invoked without 'new'`.

---

## Class Inheritance

The `extends` keyword allows one class to inherit the properties and methods of another. This establishes an "is-a" relationship, enabling you to create specialized versions of base classes without duplicating code.

```javascript
class Animal {
  constructor(name) {
    this.name = name;
    this.speed = 0;
  }
  run(speed) {
    this.speed = speed;
    console.log(`${this.name} runs at speed ${this.speed}.`);
  }
}

// Rabbit inherits from Animal
class Rabbit extends Animal {
  hide() {
    console.log(`${this.name} hides!`);
  }
}

const bunny = new Rabbit("White Rabbit");
bunny.run(5); // Inherited from Animal
bunny.hide(); // Specific to Rabbit

```

Under the hood, `extends` sets up the prototype chain so that `Rabbit.prototype` inherits from `Animal.prototype`.

### Overriding Methods and `super`

Sometimes you want the child class to have a method with the same name as the parent, but you don't want to completely replace the parent's logic—you want to build on top of it. You use the `super` keyword to call the parent's method.

```javascript
class Rabbit extends Animal {
  run(speed) {
    super.run(speed); // Call the parent method first
    console.log(`${this.name} is bouncing!`);
  }
}

```

### Overriding Constructors (The `this` Quirk)

If a child class does not have its own `constructor`, JavaScript automatically generates an empty one that passes all arguments to the parent.

However, if you define a custom `constructor` in an extending class, **you must call `super()` before you use the `this` keyword.**

```javascript
class Rabbit extends Animal {
  constructor(name, earLength) {
    // this.earLength = earLength; // ReferenceError: Must call super first!
    
    super(name); // Calls Animal constructor, which creates the 'this' object
    this.earLength = earLength; // Now 'this' is safe to use
  }
}

```

*Why?* In standard classes, the engine creates the `this` object immediately. In derived (extended) classes, the engine expects the parent class constructor to do the heavy lifting of creating `this`. If you don't call `super()`, `this` is never initialized.

### When to Use

* **Custom Errors:** As covered previously, extending the base `Error` class to create `ValidationError`, `NetworkError`, etc.
* **Base Controllers/Services:** Creating a generic `BaseRepository` class that handles standard CRUD database operations, and extending it into `UserRepository` or `ProductRepository` for specific logic.
* **Polymorphism in UI:** Defining a base `UIComponent` with generic `render()` and `destroy()` methods, extended by `Modal`, `Dropdown`, or `Tooltip`.

### Production-Level Tips & Tricks

**1. Favor Composition Over Inheritance (The Gorilla/Banana Problem)**
Deep inheritance chains (e.g., `class Admin extends User extends BaseEntity`) are a massive anti-pattern in modern JavaScript. They lead to tight coupling and the classic "gorilla holding a banana" problem: you wanted a banana, but you got a gorilla holding the banana and the entire jungle attached to it.
*Rule of thumb:* Limit inheritance to a depth of 1 or 2 levels. If things get more complex, use Composition (passing independent object instances into a class) rather than Inheritance.

**2. Arrow Functions Do Not Have `super**`
If you try to use `super` inside an arrow function within a class method, the arrow function will grab `super` from the outer function scope. This is usually exactly what you want when using callbacks inside methods (e.g., inside a `setTimeout`), as it behaves perfectly with the class instance.

**3. Extending Built-in Classes**
You can extend built-ins like `Array` or `Map`.

```javascript
class PowerArray extends Array {
  isEmpty() {
    return this.length === 0;
  }
}
let arr = new PowerArray(1, 2, 5, 10);

```

*The trick:* Built-in methods like `map` or `filter` return new instances of your *custom* class, not standard arrays. If `arr.filter(...)` returns a `PowerArray`, you can seamlessly chain `.isEmpty()` onto the end of a filter operation.

---

## Static Properties & Methods

The `static` keyword allows you to attach properties and methods directly to the class itself, rather than to the instances created by the class.

If you create an object using `new MyClass()`, that object will *not* have access to the static methods. You must call them directly on the class name.

```javascript
class Article {
  // Static property
  static publisher = "Tech Daily";

  constructor(title, date) {
    this.title = title;
    this.date = date;
  }

  // Static method
  static compareDates(articleA, articleB) {
    return articleA.date - articleB.date;
  }
}

const doc1 = new Article("JS Basics", new Date(2023, 0, 1));
const doc2 = new Article("Advanced JS", new Date(2023, 0, 15));

// Called on the class, not the instance
console.log(Article.publisher); // "Tech Daily"
console.log(Article.compareDates(doc1, doc2)); // -1209600000 

// doc1.compareDates() would throw a TypeError!

```

Under the hood, adding a `static` method is the exact equivalent of attaching a property directly to the constructor function: `Article.compareDates = function() { ... }`.

### When to Use

* **Utility & Helper Functions:** Methods that belong to the conceptual domain of the class but don't need instance data to work. `Math.max()` and `Object.keys()` are classic examples of static built-in methods.
* **Factory Methods:** Alternative ways to instantiate a class (e.g., creating a `User` from a database row versus from a JSON API payload).
* **Constants & Caching:** Storing class-wide configuration (like a `MAX_CONNECTIONS` limit) or keeping a registry of all active instances.

### Production-Level Tips & Tricks

**1. The Static Factory Pattern**
Unlike other languages (like Java or C#), JavaScript does not support constructor overloading—you can only have one `constructor()` per class. To get around this, professionals use static "factory" methods to provide multiple, readable ways to create objects.

```javascript
class User {
  constructor(name, role) {
    this.name = name;
    this.role = role;
  }

  // Factory methods
  static createGuest() {
    return new User("Guest", "readonly");
  }

  static createAdmin(name) {
    return new User(name, "admin");
  }
}

const myGuest = User.createGuest();
const myAdmin = User.createAdmin("Alice");

```

**2. The `this` Trap in Static Methods**
Inside a static method, the `this` keyword points to the **class itself**, not to an instance.

```javascript
class Database {
  static connectionLimit = 10;

  static checkLimit() {
    // 'this' refers to the Database class
    console.log(`Limit is ${this.connectionLimit}`); 
  }
}

```

*Warning:* If you extract a static method and pass it as a callback (e.g., `setTimeout(Database.checkLimit, 100)`), it will lose its `this` context just like a normal method, and `this.connectionLimit` will evaluate to `undefined`.

**3. Static Inheritance is Unique in JS**
In many object-oriented languages, static properties are not inherited. In JavaScript, they are. If `class Admin extends User`, the `Admin` class automatically inherits all of `User`'s static methods and properties.
The JS engine achieves this by setting the prototype of the `Admin` constructor function to point directly to the `User` constructor function.

```javascript
class Animal {
  static planet = "Earth";
}
class Rabbit extends Animal {}

console.log(Rabbit.planet); // "Earth" - inherited perfectly

```

---

## Private & Public Properties Methods

Object-oriented programming heavily relies on **encapsulation**—hiding internal implementation details from the outside world. In JavaScript, we distinguish between two levels of hidden object fields: **protected** (a developer convention) and **private** (a strict language feature).

### Protected Properties (The `_` Convention)

For a long time, JavaScript did not have built-in private properties. Developers adopted a strict naming convention: prefixing a property or method with an underscore (`_`) signals that it is internal and should not be touched from the outside.

Because it is just a convention, JavaScript does not enforce it. To control access, developers pair the `_` property with `get` and `set` methods.

```javascript
class CoffeeMachine {
  constructor(power) {
    this._power = power;       // Protected property
    this._waterAmount = 0;     // Protected property
  }

  // Getter (Read access)
  get waterAmount() {
    return this._waterAmount;
  }

  // Setter (Write access with validation)
  set waterAmount(value) {
    if (value < 0) {
      throw new Error("Negative water level is not allowed.");
    }
    this._waterAmount = value;
  }
}

const machine = new CoffeeMachine(100);
machine.waterAmount = 50; // Triggers the setter
// machine._waterAmount = -10; // Technically works, but violates convention!

```

*Note:* Protected properties *are* inherited. If `class EspressoMachine extends CoffeeMachine`, it can freely access and use `this._waterAmount`.

### Private Properties (The `#` Syntax)

Modern JavaScript introduced true, engine-enforced private class fields using the `#` symbol. If you try to access a `#` property from outside the class, the JavaScript engine throws a fatal `SyntaxError`.

```javascript
class SecureVault {
  // 1. Private fields MUST be declared upfront in the class body
  #pinCode; 

  constructor(pin) {
    this.#pinCode = pin; // 2. Initialized in the constructor
  }

  #checkPin(input) { // Private method
    return input === this.#pinCode;
  }

  unlock(input) {
    if (this.#checkPin(input)) {
      console.log("Vault unlocked!");
    } else {
      console.log("Access denied.");
    }
  }
}

const vault = new SecureVault(1234);
vault.unlock(1234); // "Vault unlocked!"

// console.log(vault.#pinCode); // SyntaxError: Private field must be declared in an enclosing class

```

Unlike protected properties, true private (`#`) properties are **not inherited**. An extending child class cannot access the parent's private fields.

### When to Use

* **Protecting State Integrity:** Use `#` or setters when a property must abide by strict rules (e.g., a `user.age` cannot be negative, or a `shoppingCart.total` should be strictly calculated from items, not manually overridden).
* **Hiding Complexity:** If a class relies on internal helper methods (like `#parseRawData()`), make them private so other developers using your class don't see them in their autocomplete and accidentally rely on them.
* **Library Authoring:** If you are publishing an npm package, use `#` to lock down internal state so consumers don't monkey-patch your library and break it when you release an update.

### Production-Level Tips & Tricks

**1. The `Proxy` Gotcha with Private Fields**
Modern frontend frameworks (like Vue 3 or MobX) use JavaScript `Proxy` objects to make state reactive. Proxies wrap your object to intercept calls. Because true private `#` fields are intimately tied to the exact original instance, attempting to access them through a Proxy will often throw a `TypeError: Illegal invocation`. If your class instances are going to be wrapped by a reactive framework, you usually have to stick to the `_` protected convention.

**2. Don't Over-Engineer Getters and Setters**
Developers coming from Java often write a getter and setter for *every single property*. In JavaScript, this is an anti-pattern. If a property is just reading and writing a value with no side effects or validation, just make it a public property (e.g., `this.name = name`). Only upgrade it to a private field with a getter/setter when you actually need to execute logic during the read/write process.

**3. Private Fields Must Be Pre-Declared**
Unlike normal public properties (which you can just invent on the fly inside the constructor via `this.something = 1`), private fields *must* be declared at the top level of the class block. If you try to do `this.#newProp = 5` inside a method without declaring `#newProp` at the top of the class, the code will not compile.

---

## Extending Built in Class

JavaScript allows you to extend native built-in classes like `Array`, `Map`, `Set`, and `Promise` just like you would your own custom classes. This allows you to create specialized data structures that inherit all the powerful standard methods of the base class.

```javascript
class PowerArray extends Array {
  isEmpty() {
    return this.length === 0;
  }
}

let arr = new PowerArray(1, 2, 5, 10, 50);
console.log(arr.isEmpty()); // false

```

### The Return Type Magic (`Symbol.species`)

The most powerful feature of extending built-ins is that native methods like `map`, `filter`, and `slice` automatically return an instance of your *inherited* class, not the base class.

```javascript
let arr = new PowerArray(1, 2, 5, 10, 50);

// filter() creates a new array under the hood
let filteredArr = arr.filter(item => item >= 10);

// Because it returns a PowerArray, we can chain our custom methods!
console.log(filteredArr.isEmpty()); // false
console.log(filteredArr.constructor === PowerArray); // true

```

The JavaScript engine achieves this by looking at a special static getter called `Symbol.species`. By default, it returns the constructor of the current class. If you *want* `.map()` or `.filter()` to return a standard `Array` instead of a `PowerArray` (perhaps to lock down the data after processing), you can override this behavior:

```javascript
class PowerArray extends Array {
  static get [Symbol.species]() {
    return Array; 
  }
}

let arr = new PowerArray(1, 2, 3);
let mapped = arr.map(x => x * 2);

console.log(mapped.constructor === Array); // true
// mapped.isEmpty() would now throw an error

```

### The Built-in Static Inheritance Quirk

When you extend your own custom classes (`class Child extends Parent`), the child inherits both instance methods AND static methods.

Built-in classes do not behave this way with `Object`. Even though arrays and dates are objects, `Array` and `Date` do **not** inherit static methods from `Object`.
You cannot call `Array.keys()` or `Date.assign()`.

*Why?* For static inheritance to work, the JavaScript engine links `Child.__proto__` to `Parent`. But for built-ins, `Array.__proto__` is linked to `Function.prototype`, completely bypassing `Object`'s static methods.

### When to Use

* **Web Components:** Extending `HTMLElement` (or specific elements like `HTMLButtonElement`) is the foundational specification for creating native, framework-agnostic UI components in the browser.
* **Specialized Collections:** Creating a `UniqueArray` (that prevents duplicate insertions) or an `ObservableMap` (that fires a callback event every time a key is added or removed).
* **Custom Errors:** As discussed previously, extending `Error` for domain-specific exception handling.

### Production-Level Tips & Tricks

**1. The V8 Engine Performance Trap**
Modern JavaScript engines (like V8 in Chrome/Node.js) heavily optimize standard arrays. They allocate contiguous memory blocks for arrays of numbers. When you extend `Array`, the engine often de-optimizes these structures, falling back to slower, dictionary-backed objects. For massive datasets where mathematical performance is critical, use **Composition** instead of Inheritance (i.e., create a standard class that holds a standard array as a private `#data` property).

**2. Transpilation Nightmares (Babel/ES5)**
If your build pipeline is still configured to transpile code down to ES5 (for very old browsers like IE11), extending built-ins will completely break in production. The ES5 `Array` constructor behaves strangely when invoked via `.apply()` or `.call()`, resulting in instances that don't actually have array behavior (like the dynamic `.length` property). You must ensure your compiler target is ES6+ or use specific Babel plugins to patch this.

**3. Extending `Promise` for Custom Async Flows**
Extending `Promise` is a powerful pattern for building fluent, chainable APIs (like database query builders). You can extend `Promise` to add methods like `.timeout()` or `.cancel()`, allowing developers to interact with network requests much more robustly than standard promises allow.

---

## Class checking `instanceof`

The `instanceof` operator allows you to check whether an object belongs to a specific class. More importantly, it understands inheritance, so it also returns `true` if the object belongs to any class that extends the target class.

```javascript
class Animal {}
class Rabbit extends Animal {}

const bunny = new Rabbit();

console.log(bunny instanceof Rabbit); // true
console.log(bunny instanceof Animal); // true (Inheritance!)
console.log(bunny instanceof Object); // true (All classes inherit from Object)

```

### Under the Hood: The Prototype Chain

When you run `obj instanceof Class`, JavaScript doesn't check some hidden "class name" tag. Instead, it climbs the **prototype chain**.

It asks: Does `Class.prototype` equal `obj.__proto__`?
If no, it moves one step up: Does `Class.prototype` equal `obj.__proto__.__proto__`?
It continues this until it either finds a match (returns `true`) or hits `null` at the end of the chain (returns `false`).

### Customizing `instanceof` with `Symbol.hasInstance`

If you want to completely override how `instanceof` behaves for your class, you can define a static method using the built-in `Symbol.hasInstance`. If this method exists, JavaScript will bypass the prototype chain entirely and just run your custom logic.

```javascript
class NetworkError {
  // Overriding standard instanceof behavior
  static [Symbol.hasInstance](obj) {
    // If it has a 'statusCode', we consider it a NetworkError!
    return !!obj.statusCode; 
  }
}

const badResponse = { statusCode: 404 };
console.log(badResponse instanceof NetworkError); // true

```

### When to Use

* **Argument Validation:** When writing functions that accept complex objects, `instanceof` ensures the caller passed the correct data structure (e.g., verifying a parameter is genuinely a `Date` object and not just a date string).
* **Error Routing:** As seen in the Error Handling section, using `if (err instanceof ValidationError)` to execute specific recovery logic based on the error's exact class.
* **Polymorphic Interfaces:** If a function processes an array of different UI components, you can use `instanceof` to identify whether an item is a `Button` or a `Dropdown` to call the correct render methods.

### Production-Level Tips & Tricks

**1. The Multiple Realms Trap (iframes / Workers)**
The biggest flaw of `instanceof` is that it breaks down across different execution contexts (called "realms"), such as iframes or Web Workers.
If an iframe sends an array to your main window, `data instanceof Array` will evaluate to `false`. Why? Because the array was created using the iframe's internal `Array` constructor, which is physically a different object in memory than your main window's `Array` constructor.
*Fix:* Use `Array.isArray(data)` for arrays, or the `Object.prototype.toString.call(data)` hack for other types.

**2. The `toString` Alternative for Built-ins**
Because of the realm issue, senior developers often use the `toString` method extracted directly from the base `Object.prototype` to check built-in types. It returns a reliable string like `"[object Type]"`.

```javascript
const typeCheck = Object.prototype.toString;

console.log(typeCheck.call([]));      // "[object Array]"
console.log(typeCheck.call(new Date()));// "[object Date]"

```

**3. Primitives Always Fail**
`instanceof` only works on objects. It will always return `false` for primitives, even if you check them against their wrapper classes.

```javascript
console.log("hello" instanceof String); // false
console.log(new String("hello") instanceof String); // true

// Always use typeof for primitives!
console.log(typeof "hello" === "string"); // true

```

**4. Duck Typing over Strict Types**
In highly decoupled JavaScript systems, developers often prefer "Duck Typing" ("If it walks like a duck and quacks like a duck, it's a duck") over `instanceof`. Instead of checking if an object *is* a specific class, you check if it implements the *methods* you need.

```javascript
// Instead of: if (component instanceof Modal)
if (typeof component.close === 'function') {
  component.close(); // Duck typing: we just care that it CAN close
}

```

---

## Mixins

JavaScript enforces single inheritance—a class can only `extend` one other class. However, you often need to share behavior across multiple, completely unrelated classes without forcing them into the same inheritance tree.

A **mixin** is an object containing methods that can be copied directly into another class's prototype, allowing you to "mix in" additional behavior.

```javascript
// 1. Define the mixin (just a plain object with methods)
const sayHiMixin = {
  sayHi() {
    console.log(`Hello, ${this.name}!`);
  },
  sayBye() {
    console.log(`Bye, ${this.name}!`);
  }
};

class User {
  constructor(name) {
    this.name = name;
  }
}

// 2. Copy the mixin methods into the User prototype
Object.assign(User.prototype, sayHiMixin);

const alice = new User("Alice");
alice.sayHi(); // "Hello, Alice!"

```

Because mixins just copy references, the `User` class can still `extend` a completely different base class while safely incorporating the mixin's methods.

### When to Use

* **Cross-Cutting Concerns:** Adding universal capabilities—like event emitting, logging, or state serialization—to classes that belong to entirely different domains (e.g., mixing an `EventDispatcher` into both a `ShoppingCart` and a `VideoPlayer`).
* **Flattening Inheritance:** Preventing the "Gorilla/Banana" problem. Instead of a 5-level deep inheritance chain to get the methods you need, you use a shallow base class and mix in just the specific behaviors required.
* **Feature Flags at Runtime:** Because mixins copy methods dynamically, you can conditionally apply them based on environment variables (e.g., only mixing in a `DebugLoggerMixin` if the app is in development mode).

### Production-Level Tips & Tricks

**1. The Silent Collision Trap**
The biggest danger of using `Object.assign` for mixins is method name collisions. If your class has a method named `update()`, and you apply a mixin that also has an `update()` method, the mixin will silently overwrite your class's method.
*Fix:* In large codebases, define mixin methods using `Symbol` keys instead of strings, ensuring they can never collide with the target class's existing methods.

**2. The Class Factory Pattern (Modern Mixins)**
While `Object.assign` works, modern professional JavaScript often uses "Factory Mixins." Instead of copying methods into a prototype, a mixin is a function that takes a base class as an argument and returns a brand-new dynamically generated class extending it.
This preserves the prototype chain, allows `super()` calls to work correctly inside the mixin, and avoids mutating existing prototypes.

```javascript
// A mixin is a function that returns a new anonymous class
const TimestampMixin = (BaseClass) => class extends BaseClass {
  get createdAt() {
    return new Date();
  }
};

class Document {}
class Image {}

// Apply the mixin by wrapping the base class
class TimestampedDocument extends TimestampMixin(Document) {}
class TimestampedImage extends TimestampMixin(Image) {}

const doc = new TimestampedDocument();
console.log(doc.createdAt); // Logs the current date

```

**3. State Management in Mixins**
Mixins should ideally only provide *behavior* (methods), not *state* (properties). If a mixin requires its own state (like an array of event listeners), it must initialize that state dynamically when its methods are first called. If you define a hardcoded array directly on the mixin object, every single class that uses the mixin will accidentally share the exact same array in memory.

---
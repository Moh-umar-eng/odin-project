# Currying 

**Currying** is a functional programming technique where a function with multiple arguments is transformed into a sequence of nesting functions, each taking **one argument at a time**.

Instead of calling `f(a, b, c)`, currying allows you to call `f(a)(b)(c)`.

---

### 1. The Core Mental Model

A standard function takes all its parameters in a single batch:

```javascript
// Uncurried function
function sum(a, b, c) {
  return a + b + c;
}

sum(1, 2, 3); // 6

```

A manually curried version returns a chain of functions via closures:

```javascript
// Curried function
function curriedSum(a) {
  return function(b) {
    return function(c) {
      return a + b + c;
    };
  };
}

// Or concisely with arrow functions:
const curriedSumArrow = a => b => c => a + b + c;

console.log(curriedSum(1)(2)(3)); // 6

```

---

### 2. Currying vs. Partial Application

These two concepts are closely related but functionally distinct:

* **Currying:** Always transforms a function into unary functions (functions that take **exactly one** argument per call):
$f(a, b, c) \rightarrow f(a)(b)(c)$
* **Partial Application:** Fixes a subset of arguments now and returns a function that expects the **remaining multiple arguments** all at once:
$f(a, b, c) \rightarrow f(a)(b, c)$

In JavaScript libraries (like Lodash or Ramda), the term "currying" is often implemented loosely to allow providing multiple arguments per call: `curried(1, 2)(3)` or `curried(1)(2, 3)`.

---

### 3. Writing an Automatic Curry Implementation

In real code, you don't write nested arrow functions by hand for every utility. You write a wrapper that inspects the function's arity (`fn.length`):

```javascript
function curry(fn) {
  return function curried(...args) {
    // If received arguments match or exceed the target function's parameter count:
    if (args.length >= fn.length) {
      return fn.apply(this, args);
    }
    
    // Otherwise, return a function that collects the remaining arguments:
    return function(...nextArgs) {
      return curried.apply(this, args.concat(nextArgs));
    };
  };
}

```

#### How it executes:

```javascript
function multiply(a, b, c) {
  return a * b * c;
}

const curriedMultiply = curry(multiply);

// All these invocations return 24:
console.log(curriedMultiply(2)(3)(4));
console.log(curriedMultiply(2, 3)(4));
console.log(curriedMultiply(2)(3, 4));
console.log(curriedMultiply(2, 3, 4));

```

> **Note on `fn.length`:** `Function.length` only counts parameters up to the first one with a default value, and ignores rest parameters (`...args`). Avoid using rest parameters or default arguments on the target function when passing it to a generic `curry()` helper.

---

### 4. Real-World Use Cases in Production

Currying is primarily used for **configuration reuse**, **creating specialized functions**, and **data pipelines**.

#### A. Reusable Loggers and Tracing

Instead of passing the timestamp, service name, and log level on every single message:

```javascript
const log = curry((date, level, service, message) => {
  console.log(`[${date.toISOString()}] [${level.toUpperCase()}] [${service}]: ${message}`);
});

// Create specialized loggers by pre-configuring arguments:
const logNow = log(new Date());
const authLogger = logNow("warn")("AuthService");
const paymentLogger = logNow("error")("PaymentGateway");

// Call with only the message as events occur:
authLogger("Invalid credentials attempt for user_id=402");
paymentLogger("Stripe webhook verification timed out");

```

#### B. Composable Array Pipelines

Without currying, inline array transformations often require verbose inline callbacks:

```javascript
const users = [
  { name: "Alice", role: "admin", active: true },
  { name: "Bob", role: "user", active: false },
  { name: "Charlie", role: "admin", active: false },
];

// Curried helpers
const propEq = curry((key, value, obj) => obj[key] === value);
const getProp = curry((key, obj) => obj[key]);

// Build reusable predicates:
const isAdmin = propEq("role", "admin");
const isActive = propEq("active", true);
const getName = getProp("name");

// Compose cleanly:
const activeAdminNames = users
  .filter(isAdmin)
  .filter(isActive)
  .map(getName);

console.log(activeAdminNames); // ['Alice']

```

#### C. Event Handlers in UI Frameworks (React)

Currying simplifies passing identifiers to handlers without inline arrow allocations in JSX:

```javascript
// Curried handler generator:
const handleFieldChange = (fieldName) => (event) => {
  setFormData(prev => ({
    ...prev,
    [fieldName]: event.target.value
  }));
};

// In render:
// <input onChange={handleFieldChange("email")} />
// <input onChange={handleFieldChange("password")} />

```

---

### 5. Infinite Currying (Interview Classic)

A common technical interview challenge is implementing `sum(1)(2)(3)...()`. This uses an empty call `()` as the termination signal:

```javascript
function infiniteSum(a) {
  return function(b) {
    if (b !== undefined) {
      return infiniteSum(a + b);
    }
    return a; // Terminate when called with no arguments: ()
  };
}

console.log(infiniteSum(1)(2)(3)(4)()); // 10

```

Alternatively, by overriding the `valueOf` / `toString` coercion:

```javascript
function add(a) {
  let currentSum = a;

  function f(b) {
    currentSum += b;
    return f;
  }

  f.valueOf = () => currentSum;
  return f;
}

console.log(+add(1)(2)(3)(4)); // 10 (coerced via unary +)

```

---

### Currying Trade-offs

* **Pros:** Highly reusable utilities, cleaner functional composition (`pipe` / `compose`), and straightforward parameter pre-configuration.
* **Cons:** Introduces extra function allocations in memory, creates deeper call stacks, and can make debugging stack traces harder to parse if overused.
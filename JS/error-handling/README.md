# Error Handling 

### Table of Content

- [Error Handling](#error-handling)
- [Custom Error, Extending Error](#custom-error)

## Error Handling

The `try...catch` construct allows you to gracefully handle runtime errors instead of letting your script die. When JavaScript encounters an error, it normally stops execution entirely and prints the error to the console. `try...catch` catches that error and allows you to decide what happens next.

```javascript
try {
  // Code that might fail
  const data = JSON.parse("{ badly formatted json }");
  console.log("This line will never execute.");
} catch (err) {
  // Executes only if an error occurs in the try block
  console.log("An error occurred!", err.message);
} finally {
  // Executes EVERY time, regardless of success or failure
  console.log("Cleaning up resources...");
}

```

## The Error Object

When an error is caught, the `catch` block receives an error object containing details about what went wrong. Built-in errors have three primary properties:

1. `name`: The error classification (e.g., `ReferenceError`, `SyntaxError`, `TypeError`).
2. `message`: A human-readable description of the exact issue.
3. `stack`: A string representing the sequence of nested calls that led to the error (highly useful for debugging).

## The `throw` Operator

You don't have to wait for JavaScript to break to trigger an error. You can manually trigger one using the `throw` operator. While you can technically throw strings or numbers (`throw "Oops"`), you should always throw actual Error objects to preserve the stack trace.

```javascript
function calculateDiscount(price, discount) {
  if (discount > price) {
    throw new Error("Discount cannot exceed the original price.");
  }
  return price - discount;
}

```

## When to Use

* **Parsing External Data:** Always wrap `JSON.parse()` in a `try...catch`. You can never trust that a network payload or `localStorage` item contains perfectly formatted JSON.
* **Async/Await Network Requests:** When fetching data via APIs, wrapping the `await` call in a `try...catch` is the standard way to handle 4xx/5xx HTTP errors or network timeouts.
* **Accessing Unreliable APIs:** When interacting with browser APIs that might be blocked by the user or their environment (like trying to access the clipboard, camera, or dealing with strict-mode cross-origin iframe restrictions).

Do not use `try...catch` for predictable control flow. If you can easily check for a condition beforehand (like verifying if an object property exists before accessing it), use an `if` statement. Exceptions should be for *exceptional* circumstances.

## Production-Level Tips & Tricks

**1. The Asynchronous Trap**
A synchronous `try...catch` cannot catch errors thrown inside asynchronous callbacks like `setTimeout`. The engine has already left the `try...catch` block by the time the timer fires.

```javascript
// BAD: The error crashes the app!
try {
  setTimeout(() => { throw new Error("Boom!"); }, 1000);
} catch (e) {
  console.log("Caught it!"); // Never runs
}

```

*Fix:* The `try...catch` must be *inside* the asynchronous callback, or you must use modern `async/await` with Promises, which perfectly integrates with `try...catch`.

**2. The "Rethrowing" Pattern**
A massive beginner mistake is wrapping a huge block of code in `try...catch` and swallowing *all* errors silently. You should only catch the specific errors you know how to fix. If an unexpected error occurs (like a typo causing a `ReferenceError`), you should log what you need, then `throw err` again so it propagates up.

```javascript
try {
  let user = JSON.parse(badPayload);
} catch (err) {
  if (err.name === 'SyntaxError') {
    console.log("JSON Error, showing default fallback data.");
  } else {
    throw err; // It's an unknown error (e.g., typo). Rethrow it!
  }
}

```

**3. Optional Catch Binding (ES2019)**
If you are writing a fallback mechanism where you genuinely do not care about the error details, modern JavaScript allows you to omit the error parameter entirely.

```javascript
let data;
try {
  data = JSON.parse(localStorage.getItem('user'));
} catch {
  // No (err) parameter needed. We just fallback to a default.
  data = { theme: 'light' };
}

```

**4. Global Error Handlers (The Last Line of Defense)**
Even with good `try...catch` coverage, things will slip through. In production, always set up a global error listener at the root of your application to catch unhandled exceptions and send them to your logging service (like Sentry or Datadog).

* **Browser:** `window.addEventListener('error', callback)` and `window.addEventListener('unhandledrejection', callback)`
* **Node.js:** `process.on('uncaughtException', callback)`

---

## Custom Error 

To create domain-specific errors in JavaScript, you extend the built-in `Error` class. This allows you to throw meaningful, recognizable errors (like `ValidationError` or `DatabaseError`) rather than relying on generic ones, making it much easier to handle different failure states in your `catch` blocks.

Here is the standard implementation:

```javascript
class ValidationError extends Error {
  constructor(message) {
    // 1. Always call super() first to invoke the parent Error constructor
    super(message); 
    
    // 2. Override the 'name' property (otherwise it defaults to "Error")
    this.name = "ValidationError"; 
  }
}

function readUser(json) {
  let user = JSON.parse(json);
  if (!user.age) {
    throw new ValidationError("No field: age");
  }
  if (!user.name) {
    throw new ValidationError("No field: name");
  }
  return user;
}

```

## Adding Custom Properties

The biggest advantage of extending `Error` is the ability to attach custom metadata. For example, if a property is missing, you can store exactly which property failed directly on the error object.

```javascript
class PropertyRequiredError extends ValidationError {
  constructor(property) {
    super(`No property: ${property}`);
    this.name = "PropertyRequiredError";
    this.property = property; // Custom payload data
  }
}

try {
  throw new PropertyRequiredError("email");
} catch (err) {
  console.log(err.message);  // "No property: email"
  console.log(err.name);     // "PropertyRequiredError"
  console.log(err.property); // "email"
}

```

## When to Use

* **API Development:** Creating standard HTTP errors (`NotFoundError` with a 404 status, `UnauthorizedError` with a 401 status) so your global error handler knows exactly what status code to return to the client.
* **Complex Form Validation:** Returning a custom error that contains an array of all failing fields, rather than just a single string message.
* **Differentiating Error Types:** When a single `catch` block handles code that could throw multiple types of errors (e.g., a network failure vs. bad user input), custom errors allow you to identify and route the error gracefully.

## Production-Level Tips & Tricks

**1. The `instanceof` Check**
When you catch an error, use `instanceof` to check its class rather than checking `err.name`. `instanceof` checks the prototype chain, meaning it perfectly handles inheritance.

```javascript
try {
  readUser('{ "bad": "data" }');
} catch (err) {
  if (err instanceof ValidationError) {
    // This will catch ValidationError AND PropertyRequiredError
    console.log("Invalid data: " + err.message);
  } else if (err instanceof SyntaxError) {
    console.log("JSON Syntax Error: " + err.message);
  } else {
    throw err; // Unknown error, rethrow it
  }
}

```

**2. The Base Application Error Pattern**
In large applications, manually setting `this.name = "..."` in dozens of custom error classes violates the DRY (Don't Repeat Yourself) principle. Instead, create a base `AppError` class that automatically assigns the name based on the constructor.

```javascript
class AppError extends Error {
  constructor(message) {
    super(message);
    // Dynamically sets the name to whatever the child class is called
    this.name = this.constructor.name; 
  }
}

class DatabaseError extends AppError {}
class AuthError extends AppError {}

const err = new DatabaseError("Connection lost");
console.log(err.name); // "DatabaseError" - without manually setting it!

```

**3. Cleaning Up the Stack Trace (V8 / Node.js Only)**
When you throw a custom error, the stack trace includes the error's own constructor. In professional Node.js backends (which run on the V8 engine), you can use `Error.captureStackTrace` to strip the constructor out of the trace. This makes your logs much cleaner by pointing directly to where the error was *thrown*, rather than where it was *constructed*.

```javascript
class CleanError extends Error {
  constructor(message) {
    super(message);
    this.name = this.constructor.name;
    
    // Removes this constructor from the stack trace
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, this.constructor);
    }
  }
}

```
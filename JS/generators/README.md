# Generators

A **Generator** is a special kind of function in JavaScript that can **pause its execution mid-way**, yield a value back to the caller, and later **resume right where it left off**.

Standard JavaScript functions run to completion (the "run-to-completion" model). Generators break this rule.

---

### 1. The Core Syntax: `function*` and `yield`

Generators are defined using `function*` syntax and pause themselves using the `yield` keyword.

When you call a generator function, **it does not run its body immediately**. Instead, it returns an iterator object called a **Generator Object**.

```javascript
function* numberSequence() {
  console.log("Start");
  yield 1;
  console.log("Middle");
  yield 2;
  console.log("End");
  return 3;
}

// 1. Calling the function only creates the generator object
const gen = numberSequence();

// 2. Execution only advances when .next() is called
console.log(gen.next()); // logs "Start", returns { value: 1, done: false }
console.log(gen.next()); // logs "Middle", returns { value: 2, done: false }
console.log(gen.next()); // logs "End", returns { value: 3, done: true }
console.log(gen.next()); // returns { value: undefined, done: true }

```

Every call to `.next()` returns a standard Iterator Result:

* **`value`**: The value returned by `yield` (or `return`).
* **`done`**: `false` if the generator can still produce more values; `true` if execution has completed.

---

### 2. Iterability: Loops and Spread Operators

Because generator objects implement the **Iterable Protocol** (`Symbol.iterator`), they integrate directly with `for...of` loops, the spread operator (`...`), and destructuring:

```javascript
function* generateColors() {
  yield "red";
  yield "green";
  yield "blue";
}

for (const color of generateColors()) {
  console.log(color); // "red", "green", "blue"
}

const colorArray = [...generateColors()]; // ['red', 'green', 'blue']

```

> **Gotcha with `return`:** `for...of` loops and spread syntax **ignore** the `value` of a `return` statement when `done: true`. If you want a value consumed by loops, always use `yield`.

---

### 3. Two-Way Communication: Passing Data Into Generators

Generators aren't just one-way data producers—they are **coroutines**. You can pass values *back into* the generator using `gen.next(value)`.

The argument passed to `.next(val)` becomes the **result of the paused `yield` expression**:

```javascript
function* conversationalBot() {
  const name = yield "What is your name?";
  console.log(`Received name: ${name}`);

  const age = yield `Nice to meet you, ${name}. How old are you?`;
  console.log(`Received age: ${age}`);

  return "Profile completed!";
}

const bot = conversationalBot();

// First .next() starts the generator up to the first yield
console.log(bot.next().value); 
// "What is your name?"

// Passing "Alice" assigns it to `const name` inside the generator:
console.log(bot.next("Alice").value); 
// Logs: "Received name: Alice"
// Returns: "Nice to meet you, Alice. How old are you?"

// Passing 28 assigns it to `const age`:
console.log(bot.next(28).value); 
// Logs: "Received age: 28"
// Returns: "Profile completed!"

```

> **Note:** The very first call to `.next()` cannot pass an argument (or rather, any passed value is ignored) because its only job is to kick off execution until it reaches the first `yield`.

---

### 4. Yield Delegation: `yield*`

To nest or delegate one generator into another, use `yield*`. It passes execution control to another iterable until that iterable is exhausted:

```javascript
function* stepOne() {
  yield 1;
  yield 2;
}

function* stepTwo() {
  yield 3;
  yield 4;
}

function* masterFlow() {
  yield* stepOne(); // Delegates to stepOne
  yield* stepTwo(); // Delegates to stepTwo
  yield 5;
}

console.log([...masterFlow()]); // [1, 2, 3, 4, 5]

```

---

### 5. Infinite Streams & Lazy Evaluation (Memory Efficient)

Because generators only execute on demand, you can define **infinite data streams** without causing stack overflows or consuming infinite memory:

```javascript
function* infiniteIdGenerator() {
  let id = 1;
  while (true) {
    yield `UID_${id++}`;
  }
}

const idGen = infiniteIdGenerator();

console.log(idGen.next().value); // "UID_1"
console.log(idGen.next().value); // "UID_2"
console.log(idGen.next().value); // "UID_3"
// Only advances when asked; zero memory wasted on unused future IDs.

```

---

### 6. Early Termination: `.return()` and `.throw()`

You can force a generator to finish early or inject errors from the outside:

* **`gen.return(value)`**: Immediately halts the generator and sets `{ value, done: true }`.
* **`gen.throw(error)`**: Throws an exception at the line where `yield` was paused, allowing an internal `try...catch` block to handle it:

```javascript
function* watchProcess() {
  try {
    yield "Working...";
  } catch (err) {
    console.log(`Caught inside generator: ${err.message}`);
  } finally {
    console.log("Cleanup executed!");
  }
}

const watcher = watchProcess();
watcher.next(); 

// Inject error from outside:
watcher.throw(new Error("Connection reset"));
// Logs: "Caught inside generator: Connection reset"
// Logs: "Cleanup executed!"

```

---

### 7. Real-World Applications

1. **How `async / await` was Born (Co / Task Runners):**
Before native `async / await` arrived in ES2017, libraries like `co` used generators combined with Promises to write synchronous-looking asynchronous code:
```javascript
// Under the hood, async/await is essentially generator syntax + promises
function* fetchUserWorkflow() {
  const user = yield fetch('/api/user').then(r => r.json());
  const posts = yield fetch(`/api/posts/${user.id}`).then(r => r.json());
  return posts;
}

```


2. **State Machines & Game Loops:**
Modeling complex multi-step workflows (e.g., checkout flows, turn-based games, animations) where each step waits for an external event.
3. **Large File / Log Processing:**
Reading a 10 GB CSV file line-by-line using a generator ensures only one line is in memory at any given time, rather than loading the whole file as an array.
4. **Redux Saga:**
A popular state-management side-effect library that uses generators to pause, cancel, and orchestrate complex asynchronous actions deterministically.
# JS Object from Scratch

### Table of Content 

- [Object Copy & Reference](#object-copy--reference)
- [Garbage Collection](#garbage-collection)
- [Object with `this`](#javascript-this)

## Object Copy & Reference?

The key idea is:

> When you assign an object to another variable, JavaScript usually copies the **reference**, not the actual object.

---

### 1. Primitive values vs Objects

First, understand this difference.

#### Primitive value

```javascript
let a = 10;
let b = a;

b = 20;

console.log(a); // 10
console.log(b); // 20
```

Here, `a` and `b` have **separate values**.

```text
a → 10

b → 20
```

Changing `b` doesn't affect `a`.

---

### 2. Objects behave differently

```javascript
let user1 = {
    name: "Umar"
};

let user2 = user1;

user2.name = "Ali";

console.log(user1.name);
```

Output:

```text
Ali
```

Why?

Because:

```javascript
let user2 = user1;
```

doesn't create a new object.

Both variables point to the **same object**.

```text
        ┌─────────────────┐
user1 ──┤                 │
        │  { name: "Ali" }│
user2 ──┤                 │
        └─────────────────┘
```

So:

```javascript
user1 === user2
```

returns:

```text
true
```

---

### 3. What is an Object Reference?

A **reference** is essentially a way to reach an object stored in memory.

Consider:

```javascript
const user = {
    name: "Umar",
    age: 25
};
```

You can mentally visualize it as:

```text
user
 ↓
┌───────────────┐
│ name: "Umar"  │
│ age: 25       │
└───────────────┘
```

Now:

```javascript
const anotherUser = user;
```

becomes:

```text
user ─────────┐
              ↓
       ┌───────────────┐
       │ name: "Umar"  │
       │ age: 25       │
       └───────────────┘
              ↑
anotherUser ──┘
```

There is still **only one object**.

---

### 4. Why is this important?

Look at this:

```javascript
const user1 = {
    name: "Umar"
};

const user2 = user1;

user2.name = "Ahmed";

console.log(user1.name);
```

You might expect:

```text
Umar
```

But you get:

```text
Ahmed
```

Because `user1` and `user2` reference the **same object**.

---

### 5. Copying an Object

If you actually want a **new object**, you need to copy it.

One common way is the **spread operator (`...`)**.

```javascript
const user1 = {
    name: "Umar",
    age: 25
};

const user2 = { ...user1 };

user2.name = "Ahmed";

console.log(user1.name); // Umar
console.log(user2.name); // Ahmed
```

Now:

```text
user1 ──→ Object A

user2 ──→ Object B
```

They are separate objects.

Therefore:

```javascript
console.log(user1 === user2);
```

gives:

```text
false
```

---

### 6. Shallow Copy

The spread operator creates a **shallow copy**.

For simple objects, this is usually fine:

```javascript
const user1 = {
    name: "Umar",
    age: 25
};

const user2 = { ...user1 };
```

But nested objects introduce another level of references.

```javascript
const user1 = {
    name: "Umar",
    address: {
        city: "Nanded"
    }
};

const user2 = { ...user1 };

user2.address.city = "Pune";

console.log(user1.address.city);
```

Output:

```text
Pune
```

Why?

Because the outer object was copied, but the nested `address` object is still shared.

```text
user1 ──→ Object A
             │
             └── address ──→ Object C

user2 ──→ Object B
             │
             └── address ──→ Object C
```

Both objects reference the same `address`.

---

### 7. Deep Copy

If you want nested objects to be completely independent, you need a **deep copy**.

A modern approach is:

```javascript
const user2 = structuredClone(user1);
```

Example:

```javascript
const user1 = {
    name: "Umar",
    address: {
        city: "Nanded"
    }
};

const user2 = structuredClone(user1);

user2.address.city = "Pune";

console.log(user1.address.city); // Nanded
console.log(user2.address.city); // Pune
```

Now even the nested object is copied.

```text
user1 ──→ Object A
             │
             └── address → Object C

user2 ──→ Object B
             │
             └── address → Object D
```

---

## 8. Three Things to Remember

#### Direct assignment → Same reference

```javascript
const user2 = user1;
```

```text
Same object
```

---

#### Spread → Shallow copy

```javascript
const user2 = { ...user1 };
```

```text
New outer object
Nested objects may still be shared
```

---

#### structuredClone() → Deep copy

```javascript
const user2 = structuredClone(user1);
```

```text
New object
Nested objects are also copied
```

---

#### Quick Comparison

| Code                     | What happens?  |
| ------------------------ | -------------- |
| `user2 = user1`          | Same reference |
| `{ ...user1 }`           | Shallow copy   |
| `structuredClone(user1)` | Deep copy      |

### The mental model

> **Primitive assignment copies the value.**
> **Object assignment copies the reference.**
> **To create an independent object, explicitly make a copy.**

## Garbage Collection

**Garbage Collection (GC)** is JavaScript's automatic way of **finding and removing data from memory that is no longer needed**.

The main benefit is that you normally **don't have to manually free memory** like you would in C/C++.

---

### 1. Why do we need Garbage Collection?

When JavaScript creates an object:

```javascript
const user = {
    name: "Umar",
    age: 25
};
```

Memory is allocated for that object.

Conceptually:

```text
Memory
┌─────────────────────┐
│ { name: "Umar" }    │ ← Object
│ { age: 25 }         │
└─────────────────────┘
```

But what happens when we no longer need it?

JavaScript's **Garbage Collector** can identify that the object is no longer reachable and reclaim its memory.

---

### 2. The Most Important Concept: Reachability

JavaScript garbage collection is primarily based on **reachability**.

Think of it like this:

> If your program can still reach an object, JavaScript considers it potentially useful.

If nothing can reach it anymore, it can eventually become **garbage**.

#### Example

```javascript
let user = {
    name: "Umar"
};
```

You have:

```text
user
 ↓
┌───────────────┐
│ name: "Umar"  │
└───────────────┘
```

The object is reachable through `user`.

Now:

```javascript
user = null;
```

There is no longer a reference from `user` to that object.

```text
user → null

┌───────────────┐
│ name: "Umar"  │
└───────────────┘
       ↑
    unreachable
```

The object is now **eligible for garbage collection**.

Important:

> "Eligible" does not mean the GC immediately deletes it.

The JavaScript engine decides **when** to perform garbage collection.

---

### 3. Garbage Collection Does NOT Mean `delete`

This is an important distinction.

```javascript
let user = {
    name: "Umar"
};

user = null;
```

You are not directly telling JavaScript:

> "Delete this object from memory now."

You're simply removing your reference to it.

The garbage collector may later reclaim that memory.

---

### 4. How Does JavaScript Know What Is Garbage?

A simplified way to understand modern JavaScript GC is:

#### Start with "roots"

JavaScript has certain objects/references that are considered **roots**.

For example:

```text
Global variables
      ↓
    Roots
      ↓
Reachable objects
```

The GC follows references from these roots.

#### Example

```javascript
let user = {
    name: "Umar",
    address: {
        city: "Nanded"
    }
};
```

Conceptually:

```text
Root
 │
 ↓
user
 │
 ↓
User Object
 │
 └──→ Address Object
```

Both objects are reachable.

Therefore:

```text
User Object     → KEEP
Address Object  → KEEP
```

---

### 5. When Objects Become Unreachable

Consider:

```javascript
let user = {
    name: "Umar",
    address: {
        city: "Nanded"
    }
};

user = null;
```

Now:

```text
Root
 │
 ↓
user → null


User Object
    │
    └── Address Object
```

Neither object can be reached from the root anymore.

So they become **eligible for garbage collection**.

---

### 6. A Common Example

Consider:

```javascript
function createUser() {
    const user = {
        name: "Umar"
    };

    return user;
}

const user1 = createUser();
```

The object is reachable through:

```text
user1
 ↓
User Object
```

Now:

```javascript
user1 = null;
```

The object becomes unreachable.

Eventually:

```text
GC
 ↓
detect unreachable object
 ↓
reclaim memory
```

---

### 7. What About Multiple References?

This is where your previous topic—**object references**—becomes important.

```javascript
let user1 = {
    name: "Umar"
};

let user2 = user1;
```

Now:

```text
user1 ──┐
        ↓
      Object
        ↑
user2 ──┘
```

If you do:

```javascript
user1 = null;
```

The object **cannot** be collected yet.

Why?

Because:

```text
user2
 ↓
Object
```

The object is still reachable.

Only after:

```javascript
user2 = null;
```

does it become unreachable.

```text
user1 → null
user2 → null

Object → unreachable
```

Now it is eligible for GC.

---

### 8. Circular References

You might wonder:

> What if objects reference each other?

Example:

```javascript
let user1 = {};
let user2 = {};

user1.friend = user2;
user2.friend = user1;
```

You get:

```text
user1
 ↓
Object A ─────→ Object B
   ↑              │
   └──────────────┘
```

They reference each other.

Older garbage-collection approaches could struggle with this type of situation.

Modern JavaScript garbage collectors use **reachability analysis**, so a circular reference by itself doesn't keep objects alive.

If:

```javascript
user1 = null;
user2 = null;
```

then neither object can be reached from the roots.

So both can eventually be collected.

---

### 9. Garbage Collection and Functions

Functions can also keep objects alive through their references.

For example:

```javascript
function createCounter() {
    let count = 0;

    return function () {
        count++;
        console.log(count);
    };
}

const counter = createCounter();
```

Even though `createCounter()` has finished executing, the returned function still references `count`.

Conceptually:

```text
counter
   ↓
Function
   ↓
count = 0
```

Therefore `count` remains reachable.

This is related to **closures**.

When:

```javascript
counter = null;
```

and nothing else references that function/closure, the associated data may eventually become eligible for garbage collection.

---

### 10. Memory Leak vs Garbage Collection

A **memory leak** happens when your application keeps references to objects that it no longer logically needs.

Example:

```javascript
const users = [];

function addUser() {
    users.push({
        name: "Umar"
    });
}
```

If `users` keeps growing forever:

```text
users
 ↓
Object
Object
Object
Object
Object
Object
...
```

Those objects remain reachable through `users`.

Therefore GC **cannot remove them**.

This is an important point:

> Garbage Collection can only clean up objects that are no longer reachable.

It cannot determine that an object is "logically useless" if your program still holds a reference to it.

---

### 11. Common Causes of Memory Leaks

Some common causes include:

#### Accidental global references

```javascript
user = {
    name: "Umar"
};
```

#### Growing arrays/caches

```javascript
const cache = [];

cache.push(data);
```

without ever removing old data.

#### Event listeners

For example, repeatedly adding listeners without removing them when appropriate.

#### Timers

```javascript
setInterval(() => {
    // keeps running
}, 1000);
```

Long-lived timers can keep referenced data alive.

#### Closures

A closure can unintentionally keep a large object reachable.

---

### 12. The Garbage Collection Process

A simplified mental model:

```text
       JavaScript Memory
              │
              ↓
        Find GC Roots
              │
              ↓
    Follow object references
              │
       ┌──────┴──────┐
       ↓             ↓
  Reachable      Unreachable
       │             │
       ↓             ↓
     Keep        Eligible for GC
                     │
                     ↓
              Memory reclaimed
```

Actual JavaScript engines use sophisticated techniques and optimizations, so this is a **conceptual model**, not the exact implementation.

---

### 13. Important: You Don't Control GC Directly

In normal JavaScript code, you don't write:

```javascript
free(object);
```

like you might in C.

Instead, you control **references**.

For example:

```javascript
let data = {
    name: "Umar"
};

data = null;
```

You're effectively saying:

> "I no longer need this reference."

The engine determines when memory can actually be reclaimed.

---

### 14. `delete` vs Garbage Collection

These are different concepts.

```javascript
const user = {
    name: "Umar",
    age: 25
};

delete user.age;
```

This removes the **property** `age` from the object.

It doesn't mean the entire `user` object is garbage.

```text
user
 ↓
{ name: "Umar" }
```

The object is still reachable.

---

### 15. The Big Picture

Connect this with what you learned previously:

```text
          OBJECTS
             │
             ↓
       Stored in memory
             │
             ↓
        REFERENCES
             │
             ↓
   ┌─────────────────────┐
   │ Is object reachable?│
   └──────────┬──────────┘
              │
       ┌──────┴──────┐
       ↓             ↓
      YES            NO
       │             │
       ↓             ↓
    Keep it       Garbage
                     │
                     ↓
               GC can reclaim
                  the memory
```

#### Remember these 5 points

1. **Objects consume memory.**
2. Variables hold **references** to objects.
3. GC mainly works based on **reachability**.
4. An unreachable object becomes **eligible for garbage collection**.
5. You don't manually free memory; you mainly manage **references and object lifetimes**.

## Javascript `this`

`this` is one of the most confusing JavaScript concepts at first, but the core idea is actually simple:

> **`this` refers to the object/context associated with the way a function is called.**

The important part is **how the function is called**, not where it was written.

---

### 1. `this` inside an Object Method

Let's start with the most common case:

```javascript
const user = {
    name: "Umar",

    greet: function() {
        console.log(this.name);
    }
};

user.greet();
```

Output:

```text
Umar
```

Why?

The function is called as:

```javascript
user.greet();
```

So inside `greet()`:

```javascript
this === user
```

Therefore:

```javascript
this.name
```

means:

```javascript
user.name
```

#### Mental model

```text
user
 │
 ├── name → "Umar"
 │
 └── greet()
       │
       └── this → user
```

---

### 2. `this` is NOT the Same as the Object's Name

This is important.

```javascript
const user = {
    name: "Umar",

    greet() {
        console.log(this.name);
    }
};
```

Don't think:

> "`this` means `user`."

Instead think:

> "`this` refers to the object used to call the method."

For example:

```javascript
const user = {
    name: "Umar",

    greet() {
        console.log(this.name);
    }
};

const anotherUser = {
    name: "Ali",
    greet: user.greet
};

anotherUser.greet();
```

Output:

```text
Ali
```

The same function is being used, but:

```javascript
anotherUser.greet();
```

means:

```text
this → anotherUser
```

---

### 3. The Most Important Rule

When you see:

```javascript
object.method();
```

inside `method`:

```javascript
this
```

usually refers to:

```javascript
object
```

Example:

```javascript
const car = {
    brand: "BMW",

    showBrand() {
        console.log(this.brand);
    }
};

car.showBrand();
```

Here:

```text
this → car
```

So:

```javascript
this.brand
```

is equivalent to:

```javascript
car.brand
```

---

### 4. `this` Can Access Other Properties

You can use `this` to access multiple properties.

```javascript
const user = {
    firstName: "Umar",
    lastName: "Khan",

    getFullName() {
        return this.firstName + " " + this.lastName;
    }
};

console.log(user.getFullName());
```

Output:

```text
Umar Khan
```

This is one reason `this` is useful in objects.

---

### 5. `this` Can Call Other Methods

```javascript
const user = {
    name: "Umar",

    greet() {
        this.sayHello();
    },

    sayHello() {
        console.log(`Hello ${this.name}`);
    }
};

user.greet();
```

Output:

```text
Hello Umar
```

Here:

```javascript
this.sayHello();
```

means:

```javascript
user.sayHello();
```

because `this` refers to `user`.

---

### 6. A Common Mistake

Consider:

```javascript
const user = {
    name: "Umar",

    greet: function() {
        console.log(this.name);
    }
};

const greet = user.greet;

greet();
```

You might expect:

```text
Umar
```

But you should **not assume that**.

Why?

Because you're no longer calling it as:

```javascript
user.greet();
```

You're calling:

```javascript
greet();
```

The method's call context has changed.

This is why the rule is:

> **`this` depends on how a function is called.**

---

### 7. `this` with Regular Functions

Consider:

```javascript
function showThis() {
    console.log(this);
}

showThis();
```

What `this` refers to here depends on whether you're using **strict mode** and the execution environment.

In modern JavaScript, especially with modules and strict mode, `this` in a plain function call is generally:

```javascript
undefined
```

Example:

```javascript
"use strict";

function test() {
    console.log(this);
}

test();
```

Output:

```text
undefined
```

So don't memorize:

> "`this` always means the current object."

That's incorrect.

---

### 8. `this` and Arrow Functions

This is where things get interesting.

Arrow functions **do not have their own `this`**.

Example:

```javascript
const user = {
    name: "Umar",

    greet: () => {
        console.log(this.name);
    }
};

user.greet();
```

Don't expect this to work like a normal object method.

The arrow function doesn't create its own `this`.

Instead, it **inherits `this` from its surrounding lexical scope**.

Therefore:

> For object methods, prefer a regular function/method syntax when you need `this`.

Use:

```javascript
const user = {
    name: "Umar",

    greet() {
        console.log(this.name);
    }
};
```

rather than:

```javascript
const user = {
    name: "Umar",

    greet: () => {
        console.log(this.name);
    }
};
```

---

### 9. Regular Function vs Arrow Function

This is worth remembering:

```javascript
const user = {
    name: "Umar",

    regular() {
        console.log(this.name);
    },

    arrow: () => {
        console.log(this.name);
    }
};

user.regular(); // Umar
user.arrow();   // generally not "Umar"
```

#### Why?

```text
Regular function
      ↓
Has its own `this`
      ↓
Determined by how it is called


Arrow function
      ↓
Does NOT have its own `this`
      ↓
Gets `this` from surrounding scope
```

---

### 10. Nested Functions

Here's a common interview-style problem:

```javascript
const user = {
    name: "Umar",

    greet() {
        function inner() {
            console.log(this.name);
        }

        inner();
    }
};

user.greet();
```

The `this` inside `greet()` refers to `user`.

But `inner()` is a **regular function called independently**.

So `inner()` does not automatically inherit the `this` from `greet()`.

This is one reason arrow functions are useful inside methods.

```javascript
const user = {
    name: "Umar",

    greet() {
        const inner = () => {
            console.log(this.name);
        };

        inner();
    }
};

user.greet();
```

Output:

```text
Umar
```

The arrow function inherits `this` from `greet()`.

---

### 11. `this` with `call()`

JavaScript lets you explicitly specify `this`.

```javascript
function greet() {
    console.log(this.name);
}

const user = {
    name: "Umar"
};

greet.call(user);
```

Output:

```text
Umar
```

You're essentially saying:

> "Run `greet()` with `this` set to `user`."

---

### 12. `this` with `apply()`

`apply()` is similar:

```javascript
greet.apply(user);
```

For understanding `this`, think:

```text
call()
 ↓
explicitly set `this`


apply()
 ↓
explicitly set `this`
```

The main difference between `call()` and `apply()` is how arguments are supplied.

---

### 13. `this` with `bind()`

`bind()` creates a new function with a permanently bound `this`.

```javascript
function greet() {
    console.log(this.name);
}

const user = {
    name: "Umar"
};

const userGreet = greet.bind(user);

userGreet();
```

Output:

```text
Umar
```

Think:

```text
greet()
   ↓
bind(user)
   ↓
new function
   ↓
this → user
```

---

### 14. A Very Important Interview Question

Consider:

```javascript
const user = {
    name: "Umar",

    greet() {
        console.log(this.name);
    }
};

const fn = user.greet;

fn();
```

Question:

**What does `this` refer to?**

The important observation is that this:

```javascript
fn();
```

is **not**:

```javascript
user.greet();
```

The function has been detached from the object.

Therefore, the `this` value changes according to the call context.

---

### 15. A Simple `this` Decision Tree

When you see `this`, ask:

#### Step 1

Is it an **arrow function**?

```javascript
() => {}
```

If yes:

> `this` comes from the surrounding scope.

#### Step 2

Is it a regular function called like:

```javascript
object.method();
```

If yes:

> `this` is generally `object`.

#### Step 3

Is `.call()`, `.apply()`, or `.bind()` being used?

```javascript
fn.call(obj);
```

Then:

> `this` is explicitly controlled.

#### Step 4

Is it a standalone function call?

```javascript
fn();
```

Then `this` depends on strict mode/environment.

---

### 16. The Big Picture

```text
                    `this`
                       │
            ┌──────────┴──────────┐
            │                     │
       Regular function      Arrow function
            │                     │
            ↓                     ↓
    Depends on how          Inherits `this`
    function is called      from outer scope
            │
      ┌─────┴─────┐
      ↓           ↓
obj.method()   call/apply/bind
      │           │
      ↓           ↓
  this = obj    explicitly
                controlled
```

#### The Golden Rule

Don't memorize:

> "`this` means the object."

Instead memorize:

> **For regular functions, `this` is determined by how the function is called. Arrow functions don't have their own `this`; they inherit it from the surrounding scope.**

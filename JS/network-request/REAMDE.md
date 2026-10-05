# Network Request

### Table of Content 

- [Fetch](#fetch)
- [FormData](#form-data)
- []()
- []()
- []()
- []()
- []()


## Fetch

```javascript
const response = await fetch('/api/data');

const data = await response.json(); 
// const text = await response.text(); 
// ❌ Error: TypeError: Failed to execute 'text' on 'Response': body stream already read

```

If you need to read the body multiple times, you must clone the response first:

```javascript
const response = await fetch('/api/data');
const clonedResponse = response.clone(); // Clones the stream before reading

const data = await response.json();
const rawText = await clonedResponse.text();

```

#### Available Body Methods

| Method | What It Returns | Typical Use Case |
| --- | --- | --- |
| `response.text()` | String | Plain text, HTML, or raw response data |
| `response.json()` | Parsed JavaScript Object | REST APIs returning JSON |
| `response.blob()` | `Blob` Object | Binary files (images, audio, PDF downloads) |
| `response.arrayBuffer()` | `ArrayBuffer` | Low-level binary manipulation / WebAssembly |
| `response.formData()` | `FormData` Object | Parsing `multipart/form-data` responses |

---

### 4. Sending Data (POST, PUT, DELETE)

To send data, pass an options object as the second argument:

```javascript
async function createUser(user) {
  const response = await fetch('/api/users', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json;charset=utf-8'
    },
    body: JSON.stringify(user)
  });

  if (!response.ok) {
    throw new Error(`Failed to create user: ${response.status}`);
  }

  return await response.json();
}

```

* **`method`**: The HTTP method (default is `'GET'`).
* **`headers`**: An object or `Headers` instance defining request headers.
* **`body`**: Can be a string, `FormData`, `Blob`, `ArrayBuffer`, or `URLSearchParams`. Note: If passing a `FormData` instance, **do not** manually set `'Content-Type'`—the browser automatically sets it with the proper multipart boundary string.

---

### 5. Inspecting Response Headers

Response headers are available on `response.headers` (a `Headers` Map-like object):

```javascript
const response = await fetch('https://api.github.com/users/octocat');

// Get a single header (case-insensitive)
console.log(response.headers.get('content-type'));

// Iterate over all returned headers
for (const [key, value] of response.headers) {
  console.log(`${key}: ${value}`);
}

```

---

### 6. Aborting Requests & Timeouts (`AbortController`)

Modern `fetch()` integrates with `AbortController` to cancel in-flight requests or implement timeouts:

```javascript
// Example: Request timeout with AbortSignal.timeout
try {
  const response = await fetch('/api/data', {
    signal: AbortSignal.timeout(5000) // Aborts automatically after 5 seconds
  });
  const data = await response.json();
} catch (err) {
  if (err.name === 'TimeoutError') {
    console.error('Request timed out');
  } else if (err.name === 'AbortError') {
    console.error('Request was manually aborted');
  } else {
    console.error('Network error:', err);
  }
}

```

For manual cancellation (e.g., when the user navigates away or types a new search query):

```javascript
const controller = new AbortController();

fetch('/api/search?q=term', { signal: controller.signal })
  .then(res => res.json())
  .catch(err => {
    if (err.name === 'AbortError') {
      console.log('Search canceled');
    }
  });

// Cancel the request:
controller.abort();

```

---

## Form Data


---

## 


##


**Go to Top :** [>>>](#network-request)
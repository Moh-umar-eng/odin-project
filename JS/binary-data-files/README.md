# Binary Data Files

### Table of Content 

- [Binary Data](#binary-data)
- [Text Decoder & Encoder](#text-decoder--ecoder)
- [Blob](#blob)
- [File & File Reader](#file--file-reader)


## Binary Data 

In JavaScript, **binary data** is handled through an architecture centered around two main concepts: a raw memory chunk called an **`ArrayBuffer`**, and **Views** (`TypedArray` or `DataView`) used to read and manipulate that memory.

---

### 1. The Core Architecture

An `ArrayBuffer` is a fixed-length contiguous block of raw memory.

You **cannot** read or write values to an `ArrayBuffer` directly. Instead, you wrap it in a **View**:

```
+-----------------------------------------------------------+
|               ArrayBuffer (e.g., 16 bytes)                |
+-----------------------------------------------------------+
       ▲                              ▲
       │                              │
+-------------------+       +--------------------+
|  Uint8Array View  |       | Float32Array View  |
|  (16 x 1-byte)    |       | (4 x 4-byte)       |
+-------------------+       +--------------------+

```

---

### 2. Creating an `ArrayBuffer`

To allocate raw memory, pass the total byte count:

```javascript
// Allocate 16 bytes of memory (initialized to 0)
const buffer = new ArrayBuffer(16);

console.log(buffer.byteLength); // 16

```

To duplicate or slice memory:

```javascript
// Copies bytes from index 0 up to (not including) 8 into a new ArrayBuffer
const subBuffer = buffer.slice(0, 8); 

```

---

### 3. TypedArrays (Homogeneous Views)

TypedArrays interpret buffer bytes as specific numerical types (integers or floating-point numbers).

#### Common TypedArray Types

| TypedArray | Element Size | Value Range | Description |
| --- | --- | --- | --- |
| `Int8Array` | 1 byte | $-128$ to $127$ | 8-bit signed integer |
| `Uint8Array` | 1 byte | $0$ to $255$ | 8-bit unsigned integer |
| `Uint8ClampedArray` | 1 byte | $0$ to $255$ | Clamps out-of-range values (used in Canvas `ImageData`) |
| `Int16Array` / `Uint16Array` | 2 bytes | $-32,768$ to $32,767$ / $0$ to $65,535$ | 16-bit integers |
| `Int32Array` / `Uint32Array` | 4 bytes | 32-bit signed / unsigned | 32-bit integers |
| `Float32Array` | 4 bytes | 32-bit IEEE 754 | Standard single-precision float |
| `Float64Array` | 8 bytes | 64-bit IEEE 754 | Standard double-precision float (JS numbers) |
| `BigInt64Array` / `BigUint64Array` | 8 bytes | 64-bit BigInt | 64-bit integer values |

#### Working with TypedArrays

```javascript
// Method 1: Create a view over an existing ArrayBuffer
const buffer = new ArrayBuffer(4); // 4 bytes
const view16 = new Uint16Array(buffer); // Can hold two 2-byte numbers

view16[0] = 500;
view16[1] = 1200;

// Method 2: Instantiate directly (automatically allocates the underlying buffer)
const bytes = new Uint8Array([10, 20, 30, 40]);
console.log(bytes.buffer.byteLength); // 4 bytes
console.log(bytes.byteLength);        // 4 bytes
console.log(bytes.length);            // 4 elements

// TypedArrays support standard array methods:
bytes.forEach(val => console.log(val));
const mapped = bytes.map(x => x * 2);

```

---

### 4. Out-of-Bounds & Clamping Behavior

* Standard `Uint8Array` truncates out-of-range bits (modulo arithmetic):
```javascript
const u8 = new Uint8Array(1);
u8[0] = 256;
console.log(u8[0]); // 0 (256 % 256 = 0)

u8[0] = 257;
console.log(u8[0]); // 1

```


* `Uint8ClampedArray` locks numbers to the upper/lower bounds:
```javascript
const clamped = new Uint8ClampedArray(1);
clamped[0] = 300;
console.log(clamped[0]); // 255 (capped at max)

clamped[0] = -50;
console.log(clamped[0]); // 0 (capped at min)

```



---

### 5. Heterogeneous Views: `DataView`

If you are parsing binary files (like PNG headers, MP3 tags, or network packets), bytes often have different types and specific **endianness** (byte ordering). `DataView` gives explicit byte-by-byte control:

```javascript
const buffer = new ArrayBuffer(8);
const view = new DataView(buffer);

// Syntax: setType(byteOffset, value [, littleEndian = false])
view.setUint8(0, 255);             // 1-byte at offset 0
view.setUint16(1, 1024, true);     // 2-bytes at offset 1 (Little-Endian)
view.setFloat32(3, 3.1415, false); // 4-bytes at offset 3 (Big-Endian)

// Reading back:
const num16 = view.getUint16(1, true); // 1024

```

---

### 6. Where Binary Arrays Are Used

* **Canvas & WebGL:** Manipulating raw pixel data via `ctx.getImageData()` (`Uint8ClampedArray`) or uploading vertex buffers to the GPU.
* **WebSockets / Fetch API:** Streaming audio, video, or real-time binary sensor packets.
* **File Operations:** Reading local files with `FileReader.readAsArrayBuffer(file)`.

---






## Text Decoder & Ecoder

`TextEncoder` and `TextDecoder` are built-in browser and Node.js APIs that bridge the gap between JavaScript strings and binary `ArrayBuffer` data.

* **`TextEncoder`**: Converts a **String $\rightarrow$ Binary (`Uint8Array`)** using UTF-8 encoding.
* **`TextDecoder`**: Converts **Binary (`ArrayBuffer` / `Uint8Array`) $\rightarrow$ String** using a specified encoding (UTF-8 by default).

---

### 1. `TextEncoder` (String to Bytes)

`TextEncoder` always encodes strings into the **UTF-8** format. It takes no configuration arguments.

```javascript
const encoder = new TextEncoder();

const text = "Hello 🚀";
const encodedBytes = encoder.encode(text);

console.log(encodedBytes);
// Output: Uint8Array(10) [72, 101, 108, 108, 111, 32, 240, 159, 154, 128]
console.log(encodedBytes.byteLength); // 10 bytes (ASCII chars = 1 byte each; 🚀 = 4 bytes)

```

#### Performance Optimization: `encodeInto()`

If you are encoding frequently in high-performance loops (such as WebSockets or game state serialization), creating new `Uint8Array` allocations can trigger garbage collection pauses. `encodeInto()` writes directly into a pre-allocated array:

```javascript
const encoder = new TextEncoder();
const destinationBuffer = new Uint8Array(32); // Pre-allocated storage

// Encodes directly into destinationBuffer starting at index 0
const result = encoder.encodeInto("Sample text", destinationBuffer);

console.log(result.read);    // Characters read from the source string (11)
console.log(result.written); // Bytes written to the destination buffer (11)

```

---

### 2. `TextDecoder` (Bytes to String)

`TextDecoder` takes binary data and decodes it into a standard JavaScript string. Unlike the encoder, `TextDecoder` supports a wide range of legacy character encodings (e.g., `'windows-1251'`, `'iso-8859-1'`, `'shift_jis'`). If omitted, it defaults to `'utf-8'`.

```javascript
const bytes = new Uint8Array([72, 101, 108, 108, 111]); // "Hello"

const decoder = new TextDecoder('utf-8');
const text = decoder.decode(bytes);

console.log(text); // "Hello"

```

#### Decoding Subsets of an `ArrayBuffer`

You do not need to convert an entire buffer. You can pass a subarray or view:

```javascript
const buffer = new Uint8Array([0, 1, 2, 72, 105, 99]).buffer;

// Decode only 2 bytes starting at offset 3 ("Hi")
const subView = new Uint8Array(buffer, 3, 2);
console.log(new TextDecoder().decode(subView)); // "Hi"

```

---

### 3. Handling Streamed / Chunked Data (`stream: true`)

Multi-byte characters (such as emojis, accented characters, or non-Latin scripts) require up to 4 bytes in UTF-8.

When streaming data over a network or reading chunks from a `ReadableStream`, a multi-byte character might be split between two separate incoming packets. Using standard `.decode()` on both chunks corrupts the character:

```javascript
const decoder = new TextDecoder('utf-8');

// The rocket emoji (🚀) consists of 4 bytes: [240, 159, 154, 128]
const chunk1 = new Uint8Array([240, 159]); // First half
const chunk2 = new Uint8Array([154, 128]); // Second half

// ❌ Bad: Decodes chunks independently
console.log(decoder.decode(chunk1)); // "" (replacement characters - broken)
console.log(decoder.decode(chunk2)); // "" (broken)

//  Correct: Use { stream: true } to buffer incomplete characters
console.log(decoder.decode(chunk1, { stream: true })); // "" (held in internal buffer)
console.log(decoder.decode(chunk2));                   // "🚀" (combined successfully)

```

---

### 4. Practical Example: Reading a `fetch()` Stream

A common modern use case is decoding incoming chunks from a server-sent stream or a large file download in real time:

```javascript
async function streamText(url) {
  const response = await fetch(url);
  const reader = response.body.getReader();
  const decoder = new TextDecoder('utf-8');

  let resultString = '';

  while (true) {
    const { value, done } = await reader.read();
    if (done) break;

    // Decode incoming binary chunk with stream mode enabled
    const textChunk = decoder.decode(value, { stream: true });
    resultString += textChunk;
    console.log('Received chunk:', textChunk);
  }

  // Flush any remaining characters in the stream
  resultString += decoder.decode();
  return resultString;
}

```

---

### Key Summary

| Feature | `TextEncoder` | `TextDecoder` |
| --- | --- | --- |
| **Input** | String | `ArrayBuffer`, `Uint8Array`, or other `TypedArray` |
| **Output** | `Uint8Array` | String |
| **Supported Encodings** | **UTF-8 only** (by specification) | UTF-8, Windows-1252, ISO-8859, Shift_JIS, etc. |
| **Streaming Support** | N/A | Supported via `{ stream: true }` |


---

## Blob

A **Blob** (**B**inary **L**arge **Ob**ject) represents immutable, raw binary data stored outside JavaScript's main memory heap. It can include optional metadata, such as a MIME type (`type`), and is designed for efficient handling of files, images, multimedia, and disk/network operations.

---

### 1. `Blob` vs `ArrayBuffer`

Understanding the difference is critical when working with binary data in JavaScript:

| Feature | `Blob` | `ArrayBuffer` |
| --- | --- | --- |
| **Purpose** | File-like higher-level storage (network, disk, rendering) | Low-level raw memory buffer for programmatic manipulation |
| **Mutability** | **Immutable** (read-only, cannot edit bytes in-place) | **Mutable** via `TypedArray` or `DataView` |
| **Memory location** | Often stored in browser/disk storage or virtual memory | Stored directly in JavaScript heap/RAM |
| **MIME type** | Supported (e.g., `image/png`, `text/html`) | None (raw bytes only) |

---

### 2. Creating a Blob

The constructor syntax is:

```javascript
new Blob(blobParts[, options]);

```

* **`blobParts`**: An array of `Blob`, `ArrayBuffer`, `TypedArray`, or string values.
* **`options`**: An optional configuration object:
* `type`: The MIME type string (defaults to `""`).
* `endings`: `'transparent'` (default, preserve newline chars) or `'native'` (convert newlines to OS-specific line endings).



```javascript
// Creating a text-based blob
const textBlob = new Blob(["Hello, ", "World!"], { type: "text/plain" });

// Creating a blob combining typed arrays and strings
const bytes = new Uint8Array([72, 105]); // "Hi"
const mixedBlob = new Blob([bytes, " there!"], { type: "text/plain" });

console.log(textBlob.size); // 13 (size in bytes)
console.log(textBlob.type); // "text/plain"

```

---

### 3. Slicing a Blob

Blobs are immutable, but you can extract byte ranges using `.slice()`. This creates a pointer to a slice of the original data without copying the memory immediately:

```javascript
// slice(byteStart, byteEnd, contentType)
const subBlob = textBlob.slice(0, 5, "text/plain");

console.log(subBlob.size); // 5 bytes ("Hello")

```

---

### 4. Reading Blob Data

Modern JavaScript provides direct asynchronous methods on the `Blob` prototype:

```javascript
const blob = new Blob([JSON.stringify({ user: "Alice", id: 42 })], {
  type: "application/json"
});

// 1. Read as text
const text = await blob.text();
console.log(text); // '{"user":"Alice","id":42}'

// 2. Read as an ArrayBuffer (to inspect or edit bytes)
const buffer = await blob.arrayBuffer();
const view = new Uint8Array(buffer);
console.log(view.slice(0, 4));

// 3. Read as a ReadableStream (for streaming large files)
const stream = blob.stream();
const reader = stream.getReader();
const { value, done } = await reader.read();

```

---

### 5. Common Use Cases

#### A. Generating Dynamic File Downloads

You can pair a Blob with `URL.createObjectURL()` to let users download dynamically generated content:

```javascript
function downloadFile(content, fileName, mimeType) {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);

  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = fileName;
  document.body.appendChild(anchor);
  anchor.click();

  // Cleanup to free up memory
  document.body.removeChild(anchor);
  URL.revokeObjectURL(url);
}

// Trigger download:
downloadFile("Report: 100% complete", "report.txt", "text/plain");

```

#### B. Displaying In-Memory Images (e.g., from Canvas or API)

Instead of converting images to heavy Base64 strings, convert to a Blob URL:

```javascript
// Convert HTML Canvas to Blob
canvas.toBlob((blob) => {
  const imgUrl = URL.createObjectURL(blob);
  
  const imgElement = document.querySelector("#preview");
  imgElement.src = imgUrl;

  // Revoke when the image finishes loading
  imgElement.onload = () => URL.revokeObjectURL(imgUrl);
}, "image/png");

```

#### C. Sending Files via `fetch()` / `FormData`

Blobs integrate seamlessly into network requests:

```javascript
const formData = new FormData();
const fileBlob = new Blob([JSON.stringify({ data: "payload" })], { type: "application/json" });

formData.append("uploaded_file", fileBlob, "payload.json");

await fetch("/api/upload", {
  method: "POST",
  body: formData
});

```

---

### 6. Memory Management: `URL.revokeObjectURL()`

When you call `URL.createObjectURL(blob)`, the browser keeps a reference to the Blob in memory mapped to a temporary URL (e.g., `blob:null/d3957f35-7c19-...`).

The browser cannot garbage-collect the Blob as long as this URL mapping exists:

* Always call `URL.revokeObjectURL(url)` once the resource is finished loading or no longer needed.
* Un-revoked blob URLs are only automatically cleaned up when the current document/tab unloads.

---


## File & File Reader

The **File API** provides a standardized way for web applications to represent, inspect, and read files selected by users from their local file systems or created programmatically.

---

### 1. How `File` Inherits from `Blob`

A `File` is simply a specialized `Blob` with metadata specific to the host file system.

```
+-----------------------------------------------------------+
|                           Blob                            |
|  - size (byte length)                                     |
|  - type (MIME type string)                                |
|  - slice(), text(), arrayBuffer(), stream()               |
+-----------------------------------------------------------+
                              ▲
                              │  (Inherits from)
+-----------------------------------------------------------+
|                           File                            |
|  (All Blob properties & methods, plus file metadata:)     |
|  - name (filename, e.g., "report.pdf")                    |
|  - lastModified (timestamp in ms)                         |
|  - webkitRelativePath (directory path if folder selected) |
+-----------------------------------------------------------+

```

Because `File extends Blob`, any API that accepts a `Blob` (such as `URL.createObjectURL()`, `fetch()`, `FormData.append()`, or `file.text()`) accepts a `File` with identical behavior.

#### Creating a File Programmatically

```javascript
// new File(fileBits, fileName [, options])
const file = new File(
  ['{"user": "alex"}'], 
  "profile.json", 
  { type: "application/json", lastModified: Date.now() }
);

console.log(file instanceof Blob); // true
console.log(file.name);             // "profile.json"
console.log(file.size);             // 17
console.log(file.lastModified);     // e.g. 1774362159000

```

---

### 2. Handling File Uploads via `<input type="file">`

When a user selects files using an `<input type="file">`, the browser populates an array-like `FileList` on the input's `.files` property.

#### Basic HTML Setup

```html
<!-- Single file -->
<input type="file" id="singleFileInput" accept="image/*,.pdf" />

<!-- Multiple files -->
<input type="file" id="multiFileInput" multiple />

<!-- Directory / Folder selection -->
<input type="file" id="folderInput" webkitdirectory />

```

* **`accept`**: Guides the browser file picker to filter allowed MIME types or extensions (e.g., `image/png, image/jpeg`, `image/*`, `.csv`). Note that this is purely client-side UI filtering; validation on the server remains mandatory.
* **`multiple`**: Allows selecting more than one file.
* **`webkitdirectory`**: Instructs the picker to select an entire folder.

---

### 3. Accessing and Reading Files in JavaScript

When the user selects a file, the `change` event fires on the input:

```javascript
const fileInput = document.getElementById("singleFileInput");

fileInput.addEventListener("change", async (event) => {
  const fileList = event.target.files;

  // Ensure user didn't cancel the file picker
  if (!fileList || fileList.length === 0) {
    return;
  }

  const file = fileList[0]; // The File object

  // 1. Inspect metadata
  console.log(`Name: ${file.name}`);
  console.log(`Size: ${(file.size / 1024).toFixed(2)} KB`);
  console.log(`Type: ${file.type || "unknown"}`);
  console.log(`Modified: ${new Date(file.lastModified).toLocaleString()}`);

  // 2. Read contents using modern Blob methods
  try {
    if (file.type === "application/json" || file.type.startsWith("text/")) {
      const textContent = await file.text();
      console.log("File text:", textContent);
    } else {
      const buffer = await file.arrayBuffer();
      console.log("Binary buffer byteLength:", buffer.byteLength);
    }
  } catch (err) {
    console.error("Error reading file:", err);
  }
});

```

---

### 4. Common Real-World Patterns

#### A. Instant Image Preview (Using Object URLs)

Instead of reading the entire file into a Base64 string, point an `<img>` element directly to a temporary Blob URL:

```javascript
const imageInput = document.querySelector("#imageInput");
const previewImg = document.querySelector("#preview");

imageInput.addEventListener("change", (e) => {
  const file = e.target.files[0];
  if (!file || !file.type.startsWith("image/")) return;

  // Create temporary in-memory URL
  const objectUrl = URL.createObjectURL(file);
  previewImg.src = objectUrl;

  // Revoke the URL once loaded to prevent memory leaks
  previewImg.onload = () => URL.revokeObjectURL(objectUrl);
});

```

#### B. Uploading via `FormData` and `fetch()`

Send the file directly as `multipart/form-data`:

```javascript
async function uploadFile(file) {
  const formData = new FormData();
  // formData.append(name, file, [optional custom filename])
  formData.append("avatar", file, file.name);
  formData.append("userId", "12345");

  const response = await fetch("/api/upload", {
    method: "POST",
    body: formData // Browser automatically sets Content-Type to multipart/form-data with correct boundary
  });

  return response.json();
}

```

#### C. Reading with the Legacy `FileReader` API

Before `.text()` and `.arrayBuffer()` were added directly to `Blob`, the callback/event-based `FileReader` was standard. It is still used when you explicitly need a Base64 **Data URL**:

```javascript
function readAsDataURL(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = () => resolve(reader.result); // Base64 Data URL string
    reader.onerror = () => reject(reader.error);

    reader.readAsDataURL(file);
  });
}

// Usage:
// const base64String = await readAsDataURL(file);

```

---

### 5. Drag-and-Drop Integration

Files can also be collected from drag-and-drop zones via the `DataTransfer` API:

```javascript
const dropZone = document.getElementById("dropZone");

dropZone.addEventListener("dragover", (e) => e.preventDefault());

dropZone.addEventListener("drop", (e) => {
  e.preventDefault();

  const files = e.dataTransfer.files; // FileList
  if (files.length > 0) {
    console.log("Dropped file:", files[0].name);
  }
});

```

---


**Go to Top :** [>>>](#binary-data-files)
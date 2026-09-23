# Window & Frames

### Table of Content

- [Popups & Window Methods](#popups--window-methods)
- [Popups `dialog` attribute](./src/)
- [Popups with CSS Animation](#popus-with-css-animation)
- [Cross Window Communication](#cross-origin-communication)
- [The Cilckjacking Attacks](#the-clickjacking-attack)
- [Deep Dive with Sandbox `iframe`](#deep-dive-with-sandbox-iframe)

## Popups & Window Methods

In JavaScript, popup boxes and window methods allow you to interact directly with the user and control browser windows.

---

### 1. Built-in Dialog Popups

Browsers provide three synchronous, modal popup dialogs through the global `window` object. Because they are **blocking**, execution halts until the user dismisses them.

```javascript
// 1. Alert: Display information only
window.alert("Your changes have been saved.");

// 2. Confirm: Ask for binary confirmation (true/false)
const userConfirmed = window.confirm("Are you sure you want to delete this file?");
if (userConfirmed) {
  // User clicked "OK"
} else {
  // User clicked "Cancel"
}

// 3. Prompt: Request single-line text input
const userName = window.prompt("What is your name?", "Guest"); // (message, defaultValue)
if (userName !== null) {
  console.log(`Hello, ${userName}!`);
} else {
  console.log("User canceled the prompt.");
}

```

* **Return Values:**
* `alert()`: Returns `undefined`.
* `confirm()`: Returns `true` (OK) or `false` (Cancel / Escape).
* `prompt()`: Returns the entered string, or `null` if canceled.


* **Modern Caveat:** These dialogs cannot be styled via CSS and pause the JavaScript execution thread, making them uncommon in modern production UI. Custom HTML/CSS modal dialogs (such as the native `<dialog>` element) are generally preferred.

---

### 2. Opening and Closing Browser Windows

The `window.open()` and `window.close()` methods let you manage new browser tabs or secondary windows.

```javascript
// Syntax: window.open(url, target, features)
const newWindow = window.open(
  "https://example.com",
  "_blank",
  "width=600,height=400,resizable=yes,scrollbars=yes"
);

// Close the newly created window programmatically
if (newWindow) {
  newWindow.close();
}

```

* **Popup Blockers:** Browsers block programmatic window popups unless they are triggered directly by a trusted user gesture (e.g., inside a `click` event listener).
* **Closing Restrictions:** You can only call `window.close()` on windows opened via script using `window.open()`. You cannot arbitrarily close the user's primary browser tab.

---

### 3. Essential Window Methods

Beyond popups, the `window` object manages timing, viewport navigation, and scrolling:

| Category | Method | Purpose |
| --- | --- | --- |
| **Timers** | `setTimeout(fn, delay)` | Runs a function once after specified milliseconds. |
|  | `clearTimeout(id)` | Cancels a scheduled timeout. |
|  | `setInterval(fn, delay)` | Runs a function repeatedly at the given interval. |
|  | `clearInterval(id)` | Stops an active interval loop. |
| **Scrolling** | `scrollTo(x, y)` / `scrollTo(options)` | Scrolls to absolute coordinates (e.g., `{ top: 0, behavior: 'smooth' }`). |
|  | `scrollBy(x, y)` | Scrolls relative to the current position. |
| **Frame Animation** | `requestAnimationFrame(fn)` | Schedules a repaint callback optimized for 60fps+ animations. |
| **History & Redirection** | `location.assign(url)` / `location.replace(url)` | Navigates the window to a new URL. |

---

### 4. Modern Alternative: HTML `<dialog>` Element

Because native popups block threads and lack styling, modern web applications rely on the HTML5 `<dialog>` API for non-blocking, accessible modals:

```html
<dialog id="modal">
  <p>Are you sure you want to proceed?</p>
  <button id="closeBtn">Confirm</button>
</dialog>

<script>
  const dialog = document.getElementById("modal");

  // Open as a modal (creates a backdrop and locks focus)
  dialog.showModal();

  // Close the dialog
  document.getElementById("closeBtn").addEventListener("click", () => {
    dialog.close();
  });
</script>

```

---

## Popus with CSS Animation

Animating the native `<dialog>` element and its `::backdrop` on both open and close is fully supported in pure CSS using three modern properties: `@starting-style`, `transition-behavior: allow-discrete`, and `overlay`.

---

### The CSS Solution

```css
/* 1. Closed state (default when dialog is not open) */
dialog {
  /* Animation properties */
  opacity: 0;
  transform: translateY(-20px) scale(0.95);
  transition: 
    opacity 0.25s ease-out,
    transform 0.25s ease-out,
    overlay 0.25s ease-out allow-discrete,
    display 0.25s ease-out allow-discrete;
}

/* 2. Open state (applied when dialog[open] is present) */
dialog[open] {
  opacity: 1;
  transform: translateY(0) scale(1);
}

/* 3. Starting style: where to animate FROM when entering the DOM / opening */
@starting-style {
  dialog[open] {
    opacity: 0;
    transform: translateY(-20px) scale(0.95);
  }
}

/* 4. Backdrop transition */
dialog::backdrop {
  background-color: rgb(0 0 0 / 0%);
  transition: 
    background-color 0.25s ease-out,
    overlay 0.25s ease-out allow-discrete,
    display 0.25s ease-out allow-discrete;
}

dialog[open]::backdrop {
  background-color: rgb(0 0 0 / 50%);
}

@starting-style {
  dialog[open]::backdrop {
    background-color: rgb(0 0 0 / 0%);
  }
}

```

---

### Why These Properties Are Required

Traditionally, animating `<dialog>` was tricky because toggling `display: none` immediately halts transitions. These three features solve that problem:

1. **`@starting-style`**: Defines the initial visual state right before the element switches from `display: none` to `display: block`. Without this, the browser skips the opening transition because there is no prior rendered frame to interpolate from.
2. **`allow-discrete` (`transition-behavior`)**: Tells the browser to delay changing discrete properties like `display` and `overlay` until all continuous transitions (such as `opacity` and `transform`) finish executing.
3. **`overlay`**: Controls when the element leaves the browser's native **top layer**. Transitioning `overlay` with `allow-discrete` ensures the dialog stays on top during its exit animation rather than instantly dropping behind other elements.

---

### Minimal HTML & JavaScript Setup

No animation logic or `setTimeout` calls are needed in JavaScript—standard `.showModal()` and `.close()` calls trigger the entry and exit animations automatically.

```html
<button id="openBtn">Open Dialog</button>

<dialog id="animatedDialog">
  <h2>Smooth Dialog</h2>
  <p>This modal slides and fades in and out purely via CSS.</p>
  <button id="closeBtn">Close</button>
</dialog>

<script>
  const dialog = document.getElementById('animatedDialog');
  document.getElementById('openBtn').addEventListener('click', () => dialog.showModal());
  document.getElementById('closeBtn').addEventListener('click', () => dialog.close());
</script>

```

---

## Cross Origin Communication


In JavaScript and browser security, the **Cross-Window Communication** (often referred to under "Cross-origin iframe & window communication" on *javascript.info*) chapter covers how two windows or tabs—or an `<iframe>` and its parent—interact when they originate from different domains, protocols, or ports.

---

### 1. Same-Origin Policy (SOP)

Two URLs have the **Same Origin** if and only if three components match:

1. **Protocol** (`http` vs `https`)
2. **Domain/Host** (`site.com` vs `api.site.com`)
3. **Port** (`:80`, `:443`, `:3000`)

| Compared URLs | Same Origin? | Reason |
| --- | --- | --- |
| `[http://site.com](http://site.com)` and `[https://site.com](https://site.com)` | **No** | Different protocol |
| `[http://site.com](http://site.com)` and `[http://sub.site.com](http://sub.site.com)` | **No** | Different domain |
| `[http://site.com](http://site.com)` and `[http://site.com:8080](http://site.com:8080)` | **No** | Different port |
| `[http://site.com/page1](http://site.com/page1)` and `[http://site.com/page2](http://site.com/page2)` | **Yes** | Protocol, host, and port match |

When windows share the same origin, they have unrestricted access to each other's DOM, variables, and methods.

---

### 2. What Cross-Origin Windows Can and Cannot Do

If origin $A$ opens a window to origin $B$ via `window.open()`, or embeds origin $B$ inside an `<iframe>`:

* **What is Blocked:**
* Reading or modifying the DOM (`win.document` throws a `DOMException`).
* Reading JavaScript variables or functions (`win.myVar`).
* Reading URLs or cookies (`win.location.href` throws an error).


* **What is Allowed (Safe Exceptions):**
* Changing `location.href` (write-only: you can redirect the other window, but cannot read where it is).
* Checking reference status: `win.closed` (boolean).
* Closing the window: `win.close()` (only if opened by the script).
* Communicating via `window.postMessage(...)`.



```javascript
const popup = window.open('https://example.com');

// ❌ Throws SecurityError (Blocked by SOP)
console.log(popup.document.title);
console.log(popup.location.href);

//  Allowed (Write-only)
popup.location = 'https://another-site.com'; 

//  Allowed
console.log(popup.closed);

```

---

### 3. Safe Cross-Origin Messaging: `postMessage`

The standard, secure way for cross-origin windows to communicate is using the **`postMessage` API**.

#### Sending Data (`targetWindow.postMessage`)

```javascript
// targetWindow.postMessage(data, targetOrigin);
const popup = window.open('https://recipient-domain.com');

// Wait for it to load, or trigger via user action:
popup.postMessage({ type: 'AUTH_SUCCESS', token: 'xyz123' }, 'https://recipient-domain.com');

```

* **`data`**: Any cloneable JavaScript value (objects, arrays, strings) serialized via the structured clone algorithm.
* **`targetOrigin`**: The origin allowed to receive the message.
* Always specify the exact origin (`'[https://recipient-domain.com](https://recipient-domain.com)'`).
* Avoid using `'*'` in production—it allows any site to intercept sensitive payloads if the window redirects.



#### Receiving Data (`window.addEventListener('message')`)

The receiving window listens for the `'message'` event:

```javascript
window.addEventListener('message', (event) => {
  // 1. ALWAYS verify the sender origin first
  if (event.origin !== 'https://sender-domain.com') {
    return; // Ignore untrusted messages
  }

  // 2. Read the payload
  console.log('Received data:', event.data);

  // 3. Optional: reply back to the sender
  event.source.postMessage({ status: 'ACK' }, event.origin);
});

```

Key properties of the `event` object:

* **`event.data`**: The payload sent by the caller.
* **`event.origin`**: The origin of the window that sent the message (e.g., `'[https://sender-domain.com](https://sender-domain.com)'`).
* **`event.source`**: A reference to the sender window, allowing bidirectional replies via `event.source.postMessage(...)`.

---

### 4. Legacy Workaround: `document.domain`

Historically, subdomains could relax restrictions by explicitly assigning `document.domain`:

```javascript
// On admin.site.com and forum.site.com:
document.domain = 'site.com'; // Allows cross-subdomain access

```

> **Warning:** Modern browsers have deprecated and disabled `document.domain` mutations by default because it bypasses the security boundaries between subdomains. Modern architectures use `postMessage` or SharedWorker/BroadcastChannel (for same-origin contexts) instead.

---

### 5. Common Production Use Cases

* **Third-Party OAuth Popups:** Opening an identity provider (e.g., Google or GitHub) in a popup, which then uses `window.opener.postMessage(authPayload, '[https://yourapp.com](https://yourapp.com)')` to hand the access token back to your main application and close itself.
* **Embedded Payment Widgets & Chatbots:** Embedding payment forms or widgets via `<iframe>` where the embedded frame notifies the parent page of size changes or checkout status updates.

---

## OAuth Type Modal Example

Here is an end-to-end implementation of an OAuth popup flow using `window.open` and `postMessage`. It consists of two parts: the **Parent Application** (your main site) and the **OAuth Callback Page** (where the OAuth provider redirects after authorization).

---

### Architecture Overview

1. **Parent Page (`[https://myapp.com](https://myapp.com)`):** Opens a centered popup pointing to the OAuth authorization URL and listens for the `message` event.
2. **Popup Window:** The user logs in and consents at the OAuth provider.
3. **Redirect to Callback (`[https://myapp.com/oauth/callback](https://myapp.com/oauth/callback)`):** The provider redirects back with authorization details (code or token) in the URL.
4. **Callback Script:** Extracts the credentials, sends them via `window.opener.postMessage()`, and immediately closes the popup.
5. **Parent Page:** Validates the message origin, extracts the token, updates the UI, and cancels cleanup timers.

---

### 1. The Parent Application (`index.html`)

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>OAuth Popup Example</title>
</head>
<body>
  <button id="loginBtn">Log in with Provider</button>
  <div id="status">Status: Logged out</div>

  <script>
    const loginBtn = document.getElementById('loginBtn');
    const statusDiv = document.getElementById('status');

    // Configuration
    const AUTH_URL = 'https://auth.example.com/oauth/authorize?client_id=123&redirect_uri=https://myapp.com/oauth/callback&response_type=token';
    const EXPECTED_ORIGIN = 'https://myapp.com'; // In production, callback is served from your own domain

    let popupRef = null;
    let pollTimer = null;

    function openCenteredPopup(url, title, w, h) {
      const dualScreenLeft = window.screenLeft !== undefined ? window.screenLeft : window.screenX;
      const dualScreenTop = window.screenTop !== undefined ? window.screenTop : window.screenY;

      const width = window.innerWidth || document.documentElement.clientWidth || screen.width;
      const height = window.innerHeight || document.documentElement.clientHeight || screen.height;

      const left = ((width - w) / 2) + dualScreenLeft;
      const top = ((height - h) / 2) + dualScreenTop;

      return window.open(
        url,
        title,
        `width=${w},height=${h},top=${top},left=${left},scrollbars=yes,status=no,resizable=yes`
      );
    }

    loginBtn.addEventListener('click', () => {
      // 1. Open the popup
      popupRef = openCenteredPopup(AUTH_URL, 'OAuthLogin', 550, 650);

      if (!popupRef || popupRef.closed || typeof popupRef.closed === 'undefined') {
        alert('Popup blocked! Please allow popups for this site.');
        return;
      }

      statusDiv.textContent = 'Status: Waiting for authentication...';

      // 2. Poll to detect if user closed the window manually
      clearInterval(pollTimer);
      pollTimer = setInterval(() => {
        if (!popupRef || popupRef.closed) {
          clearInterval(pollTimer);
          window.removeEventListener('message', handleAuthMessage);
          statusDiv.textContent = 'Status: Login window was closed.';
        }
      }, 500);

      // 3. Listen for postMessage
      window.addEventListener('message', handleAuthMessage);
    });

    function handleAuthMessage(event) {
      // Security Check 1: Verify exact sender origin
      if (event.origin !== EXPECTED_ORIGIN) {
        return; // Ignore untrusted messages from 3rd party scripts/extensions
      }

      // Security Check 2: Filter by message type
      const message = event.data;
      if (!message || message.type !== 'OAUTH_AUTH_SUCCESS') {
        return;
      }

      // Cleanup listeners and timers
      clearInterval(pollTimer);
      window.removeEventListener('message', handleAuthMessage);

      // Process received credentials
      const { token, expiresIn } = message.payload;
      console.log('Access token received:', token);
      statusDiv.textContent = `Status: Logged in! Token: ${token.slice(0, 10)}...`;
    }
  </script>
</body>
</html>

```

---

### 2. The Callback Page (`callback.html`)

This page is hosted on your domain at `[https://myapp.com/oauth/callback](https://myapp.com/oauth/callback)`. When the OAuth provider redirects here, this script executes:

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Authenticating...</title>
</head>
<body>
  <p>Authentication complete. Finalizing session...</p>

  <script>
    (function () {
      // 1. Ensure this window was opened by our parent application
      if (!window.opener) {
        document.body.textContent = 'Parent window not found. You may close this tab.';
        return;
      }

      // 2. Parse OAuth parameters (e.g., token from hash fragment or query params)
      const params = new URLSearchParams(window.location.hash.substring(1) || window.location.search);
      const accessToken = params.get('access_token');
      const expiresIn = params.get('expires_in');
      const error = params.get('error');

      const TARGET_ORIGIN = 'https://myapp.com'; // Target origin of the parent window

      if (accessToken) {
        // 3. Send the token back to the parent window
        window.opener.postMessage(
          {
            type: 'OAUTH_AUTH_SUCCESS',
            payload: {
              token: accessToken,
              expiresIn: expiresIn
            }
          },
          TARGET_ORIGIN // Enforce that only your parent origin can read this
        );
      } else if (error) {
        window.opener.postMessage(
          {
            type: 'OAUTH_AUTH_ERROR',
            error: error
          },
          TARGET_ORIGIN
        );
      }

      // 4. Close the popup
      window.close();
    })();
  </script>
</body>
</html>

```

---

### Essential Security Measures

1. **Explicit Target Origins (`postMessage(data, targetOrigin)`):** Never pass `'*'` as the second parameter when sending sensitive tokens. Specifying `'[https://myapp.com](https://myapp.com)'` guarantees the payload is dropped if the parent window redirects to a malicious site.
2. **Explicit Origin Verification (`event.origin`):** The listener inside the parent page must always check `if (event.origin !== EXPECTED_ORIGIN)` before parsing `event.data`. Any extension or open iframe can dispatch message events to your window.
3. **Structured Message Types:** Wrap payloads in distinct identifiers (`type: 'OAUTH_AUTH_SUCCESS'`) to distinguish auth data from messages sent by analytics tools or developer extensions.
4. **State / CSRF Token Verification:** In authorization code flows (PKCE / server-side exchange), generate a unique `state` parameter prior to `window.open()`, pass it to the OAuth provider, and verify that the returned `state` in the callback matches the initial value before trusting the payload.


---

## The clickjacking attack

**Clickjacking** (also known as a **UI Redress Attack**) is a malicious technique where an attacker tricks a user into clicking on an invisible or disguised UI element on an actionable website, causing the user to inadvertently perform actions they never intended to perform.

In javascript.info's "Cross-origin iframe & window communication" context, clickjacking is the primary real-world security vulnerability that explains **why browsers restrict framing and enforce strict cross-origin display policies**.

---

### How Clickjacking Works

The classic clickjacking scenario relies on CSS layering (`opacity` and `z-index`):

```
       User's Pointer
             ↓
[ Malicious Page: Transparent <iframe> (Target Site) ]  <-- opacity: 0; z-index: 2
[ Malicious Page: Decoy UI ("Click here to win!")   ]  <-- opacity: 1; z-index: 1

```

1. **Victim is Authenticated:** The victim is logged into a target service (e.g., `bank.com`, `social-network.com`, or an admin panel).
2. **Attacker Hosts a Decoy Page:** The attacker builds an attractive page with a lure—like a "Click to play a game" or "You won a prize!" button.
3. **Hidden Overlay via `<iframe>`:** The attacker places `bank.com` inside an `<iframe>` directly over their decoy button.
4. **CSS Camouflage:**
* Attacker sets the `<iframe>`'s opacity to `0` (or `0.0001`).
* The attacker positions the target's critical action (e.g., "Delete Account", "Transfer $500", or "Like Page") precisely beneath the user's cursor.


5. **The Click:** The user believes they are clicking the decoy game, but the browser registers the mouse click directly onto the transparent `bank.com` button inside the frame. Because the user is logged in, their session cookies are sent with the action.

---

### Basic Attack Anatomy (HTML / CSS)

```html
<style>
  /* Container holding the decoy and the hidden frame */
  .stage {
    position: relative;
    width: 300px;
    height: 100px;
  }

  /* The visible lure the user thinks they are clicking */
  .decoy-btn {
    position: absolute;
    top: 0;
    left: 0;
    width: 200px;
    height: 50px;
    z-index: 1;
    background: green;
    color: white;
  }

  /* The target site made invisible but fully clickable */
  .target-frame {
    position: absolute;
    top: -45px; /* Offset to align target button over decoy */
    left: -20px;
    width: 500px;
    height: 400px;
    opacity: 0; /* Invisible to the eye */
    z-index: 2; /* Renders ABOVE the decoy */
  }
</style>

<div class="stage">
  <button class="decoy-btn">Claim Free Gift</button>
  <iframe class="target-frame" src="https://victim-service.com/account/delete"></iframe>
</div>

```

---

### Defenses Against Clickjacking

#### 1. Modern Standard: `Content-Security-Policy: frame-ancestors` (Recommended)

The HTTP response header `Content-Security-Policy` with the `frame-ancestors` directive defines which sites are allowed to embed your page inside `<frame>`, `<iframe>`, or `<object>`.

```http
# Disallow framing entirely on any site:
Content-Security-Policy: frame-ancestors 'none';

# Allow framing ONLY by your own origin:
Content-Security-Policy: frame-ancestors 'self';

# Allow framing only by trusted origins:
Content-Security-Policy: frame-ancestors 'self' https://trusted-partner.com;

```

#### 2. Legacy Header: `X-Frame-Options`

Prior to CSP Level 2, browsers used the `X-Frame-Options` HTTP response header:

```http
# Prevent all framing
X-Frame-Options: DENY

# Allow framing only if the parent is the same origin
X-Frame-Options: SAMEORIGIN

```

*(Note: While still widely deployed for legacy browser support, modern browsers prioritize `CSP frame-ancestors` if both are present).*

#### 3. SameSite Cookies

Clickjacking relies on the browser automatically attaching session cookies when the user interacts with the framed page. Setting `SameSite` on authentication cookies blocks this:

```http
Set-Cookie: session_id=abc123xyz; Secure; HttpOnly; SameSite=Lax

```

* `SameSite=Lax` or `SameSite=Strict`: When embedded inside a cross-origin `<iframe>`, requests to `victim-service.com` will not include the cookie on state-modifying actions, rendering the user unauthenticated within the frame.

#### 4. Legacy Client-Side Defense: "Framebusting" Scripts (Avoid)

Before modern headers existed, developers wrote JavaScript in their pages to detect if they were framed:

```javascript
// DO NOT RELY ON THIS ALONE
if (window.top !== window.self) {
  window.top.location = window.self.location;
}

```

**Why Framebusting fails:**

* An attacker can disable scripts inside their iframe using the sandbox attribute: `<iframe src="..." sandbox="allow-forms allow-scripts">` without `allow-top-navigation`.
* In modern web development, always enforce frame protection via **HTTP response headers** (`CSP` and `X-Frame-Options`), not JavaScript.

---

## Deep Dive with Sandbox `iframe`

The `sandbox` attribute on an `<iframe>` applies an extra layer of restrictions to embedded content. When present, the browser treats the framed document as having a unique, opaque origin and disables potentially dangerous features by default.

---

### 1. The Default State: `sandbox=""`

Adding the `sandbox` attribute with no values (or an empty string `sandbox=""`) enforces maximum security restrictions on the embedded document:

* **No Scripts:** JavaScript execution is completely disabled.
* **Treated as Unique Origin:** The document cannot access cookies, `localStorage`, `sessionStorage`, or same-origin DOMs (its origin becomes `null`).
* **No Form Submission:** `<form>` submissions are blocked.
* **No Top Navigation:** The iframe cannot redirect or alter `window.top.location`.
* **No New Windows/Tabs:** `window.open()`, `target="_blank"`, and `showModalDialog()` are blocked.
* **No Modals:** `alert()`, `confirm()`, `prompt()`, and `beforeunload` are blocked.
* **No Automatic Playback/Downloads:** Media autoplay and file downloads are restricted.

```html
<!-- Maximum restrictions: completely inert frame -->
<iframe src="untrusted.html" sandbox></iframe>

```

---

### 2. Available Sandbox Tokens (Whitelist Flags)

You selectively re-enable features by passing space-separated tokens to the `sandbox` attribute:

| Token | What It Re-enables |
| --- | --- |
| `allow-scripts` | Allows the iframe to run JavaScript (does **not** allow creating popups or modals unless paired with other tokens). |
| `allow-same-origin` | Allows the iframe to retain its actual origin rather than being forced into an opaque `null` origin. Can access its own cookies and `localStorage`. |
| `allow-forms` | Allows the embedded document to submit forms. |
| `allow-popups` | Allows `window.open()`, `target="_blank"`, and `showModalDialog()`. New windows do not inherit sandbox restrictions unless `allow-popups-to-escape-sandbox` is omitted. |
| `allow-popups-to-escape-sandbox` | Allows popups opened by the sandboxed page to be free of sandbox restrictions. |
| `allow-top-navigation` | Allows the framed document to navigate the top-level browsing context (`window.top`). |
| `allow-top-navigation-by-user-activation` | Allows top-level navigation **only** if triggered by an explicit user gesture (e.g., clicking a link or button), blocking spontaneous redirects. |
| `allow-modals` | Allows opening modal dialogs via `alert()`, `confirm()`, `prompt()`, etc. |
| `allow-downloads` | Enables downloading files via `<a>` elements with the `download` attribute or navigation leading to downloads. |
| `allow-pointer-lock` | Allows the iframe to use the Pointer Lock API (mouse locking for 3D/games). |
| `allow-orientation-lock` | Allows locking screen orientation via the Screen Orientation API. |

---

### 3. Critical Security Warning: Never Pair `allow-scripts` with `allow-same-origin`

Setting both `allow-scripts` and `allow-same-origin` on an iframe served from the **same origin** as the host page completely breaks the sandbox:

```html
<!-- ⚠️ DANGEROUS: Effectively nullifies the sandbox -->
<iframe src="/user-content.html" sandbox="allow-scripts allow-same-origin"></iframe>

```

**Why this is dangerous:**

1. `allow-same-origin` grants the frame access to your site's DOM.
2. `allow-scripts` lets the framed page execute JavaScript.
3. A script inside the iframe can simply access `parent.document`, find its own `<iframe>` tag, delete or modify the `sandbox` attribute, and reload itself with full privileges.

> **Rule:** If the framed page must run scripts and access storage/APIs, host the untrusted content on a dedicated, isolated domain (e.g., `user-content-domain.com` instead of `yourapp.com`).

---

### 4. Common Real-World Configurations

#### Safe Third-Party Ad or Widget

Allows scripts to render interactive content, allows popups for ad clicks, but isolates the origin and blocks background frame busting:

```html
<iframe 
  src="https://ads.partner.com/banner"
  sandbox="allow-scripts allow-popups allow-top-navigation-by-user-activation">
</iframe>

```

#### Markdown / Comment Preview (Read-Only HTML)

Renders user-supplied HTML safely by stripping script execution, form submissions, and storage access entirely:

```html
<iframe srcdoc="<p>User generated markup</p>" sandbox></iframe>

```

#### Embedded Document / Spreadsheet Viewer

Allows scripts and form handling for user interactions while maintaining sandbox boundaries on the parent window:

```html
<iframe 
  src="https://viewer.service.com/doc/123" 
  sandbox="allow-scripts allow-forms allow-downloads">
</iframe>

```

---



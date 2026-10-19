# What Is Web Security?

## 1. Web Development Principles

Web development is not just about creating a website that looks good and works correctly. A good website should also be secure, reliable, accessible, and easy to maintain.

The following are some important principles of web development:

- **Purpose:** The website should serve its intended purpose and solve the problem it was designed for.
- **Simplicity:** Keep the design and implementation simple. Simpler systems are generally easier to understand, maintain, and secure.
- **Colors:** Use appropriate colors to create a consistent design and make the website accessible to users.
- **Images:** Use relevant and optimized images to improve the user experience without unnecessarily increasing page load time.
- **Performance:** Ensure that the website loads quickly and uses server resources efficiently.
- **Security:** Protect the website, its users, and its data from unauthorized access, manipulation, and other attacks.

> [!NOTE]
> Software developers are responsible for writing secure code and following secure coding practices. They should also make sure that the software they build follows appropriate security standards.
>
> Developers generally focus on defensive security by preventing vulnerabilities and protecting systems. Ethical hackers and penetration testers approach systems from an offensive perspective to identify weaknesses before malicious attackers exploit them.
>
> Both approaches are important for building secure applications.

## 2. What Is Web Security?

Web security is the practice of protecting websites, web applications, servers, APIs, and user data from security threats.

A web application may contain sensitive information such as usernames, passwords, email addresses, payment information, and personal records. If the application is not properly secured, attackers may steal data, modify information, gain unauthorized access, or make the application unavailable.

The main goal of web security is to identify vulnerabilities, prevent attacks, and minimize the impact of security incidents.

### Why Is Web Security Important?

- **Data protection:** Prevent unauthorized access to sensitive information.
- **User privacy:** Protect personal information belonging to users.
- **Application integrity:** Prevent unauthorized modification of data and application behavior.
- **Availability:** Keep the application accessible to legitimate users.
- **Authentication and authorization:** Ensure that users are who they claim to be and can access only the resources they are permitted to use.
- **Trust:** Help users trust the application and the organization that operates it.

## 3. Web Security Principles

### 3.1 Confidentiality

Confidentiality means that sensitive information should be accessible only to authorized people or systems.

For example, a user should not be able to view another user's private messages or account details.

**How developers can maintain confidentiality:**

- Use HTTPS to encrypt data in transit.
- Encrypt sensitive data when appropriate.
- Store passwords using a secure password-hashing algorithm rather than storing them as plain text.
- Apply access controls to sensitive resources.
- Avoid exposing secrets in source code, logs, or API responses.

### 3.2 Integrity

Integrity means that information should remain accurate and should not be modified without authorization.

For example, a customer should not be able to change the price of a product or modify another user's account balance by manipulating a request.

**How developers can maintain integrity:**

- Validate data on the server.
- Check authorization before modifying resources.
- Use database transactions where appropriate.
- Apply database constraints.
- Protect sensitive operations against unauthorized modification.

### 3.3 Availability

Availability means that a system should remain accessible to legitimate users when they need it.

For example, an online shopping website should remain available during normal traffic and should be prepared to handle unexpected increases in requests.

**How developers can maintain availability:**

- Optimize database queries and application performance.
- Apply rate limiting to prevent excessive requests.
- Use appropriate caching.
- Monitor application health and errors.
- Implement backups and recovery procedures.
- Protect against denial-of-service attacks.

### 3.4 Authentication

Authentication is the process of verifying the identity of a user or system.

For example, when a user logs in with a username and password, the application verifies whether the credentials are valid.

Common authentication methods include:

- Passwords.
- One-time passwords (OTPs).
- Multi-factor authentication (MFA).
- Passkeys.
- Client certificates.

**Important distinction:**

Authentication answers: "Who are you?"

Authorization answers: "What are you allowed to do?"

A user may successfully authenticate but still be unauthorized to access an administrator's dashboard.

## 4. The OWASP Top 10 Web Application Security Risks

The OWASP Top 10 is a widely recognized awareness document that highlights important web application security risks.

The following topics are based on the concepts in your workshop notes. They are not presented as the exact current OWASP Top 10 ranking, which changes between editions.

### 4.1 Injection

Injection vulnerabilities occur when an application treats untrusted input as part of an instruction or query instead of treating it strictly as data.

This can happen when user input is incorporated into SQL queries, operating system commands, directory queries, or other interpreters without appropriate protection.

Common types include:

- SQL Injection
- Command Injection
- XML Injection
- LDAP Injection

**Example:**

Suppose an application expects a numeric user ID but accepts arbitrary input and directly inserts it into a database query.

The developer may expect the input to contain only a number. However, an attacker may supply specially crafted input that changes how the query is interpreted.

**How to prevent injection:**

- Use parameterized queries or prepared statements for database operations.
- Avoid constructing operating system commands from user input.
- Use safe APIs that separate instructions from data.
- Validate input according to the expected format.
- Apply least-privilege permissions to database accounts and application processes.
- Avoid relying on input validation alone as the primary defense.

#### 4.1.1 SQL Injection

SQL Injection occurs when untrusted input changes the structure or meaning of a SQL query.

Consider a login or user lookup feature that retrieves a user by ID.

**Normal input:**

`https://www.example.com/?user_id=1`

The application receives the user ID `1`.

A vulnerable backend might construct the query as follows:

```sql
SELECT * FROM Users WHERE user_id = 1;
```

**Malicious input:**

```text
1 OR 1=1
```

If the application directly concatenates this input into its SQL statement, it might produce:

```sql
SELECT * FROM Users WHERE user_id = 1 OR 1=1;
```

The condition `1=1` is always true. Consequently, the query may return multiple records instead of the intended user's record.

The exact impact depends on the query, database permissions, and application logic.

**Secure approach: Use parameterized queries**

Instead of combining user input directly with SQL instructions, pass the input as a parameter.

Example using Python and SQLite:

```python
user_id = request.args.get("user_id", "")

cursor.execute(
    "SELECT * FROM Users WHERE user_id = ?",
    (user_id,)
)
```

The database treats the supplied value as data rather than executable SQL syntax.

The placeholder syntax varies by database driver and programming language.

**Key takeaway:** Never build SQL queries by directly concatenating untrusted user input.

#### 4.1.2 Command Injection

Command Injection occurs when an application passes untrusted input to an operating system shell in a way that allows the input to change the command being executed.

For example, a web application might provide a feature that checks whether a server is reachable. If the developer constructs a shell command by concatenating a user-supplied hostname, specially crafted input could cause additional commands to execute.

The consequences may include:

- Reading sensitive files.
- Modifying or deleting files.
- Accessing environment variables and secrets.
- Running unauthorized processes.
- Compromising the application server.

**How to prevent Command Injection:**

- Avoid invoking an operating system shell when a suitable library or API is available.
- Use APIs that accept an executable and separate arguments rather than a single shell command string.
- Validate input against a strict allowlist of permitted values.
- Apply appropriate operating system permissions.
- Run application processes with the minimum privileges required.
- Do not assume that removing a few special characters makes shell commands safe.

**Key takeaway:** If an application does not need to execute operating system commands, do not introduce shell execution unnecessarily.

#### 4.1.3 XML Injection

XML Injection occurs when untrusted input is inserted into XML content in a way that changes its structure or meaning.

Depending on the application, this may allow an attacker to manipulate XML data or interfere with how the application processes it.

A related and particularly important risk is XML External Entity (XXE) injection. This can occur when an XML parser processes external entity references in an unsafe configuration.

Potential consequences include unauthorized file access, disclosure of internal information, and requests to internal services.

**How to prevent XML-related vulnerabilities:**

- Use safe XML APIs.
- Disable external entity processing when it is not required.
- Avoid constructing XML documents through unsafe string concatenation.
- Validate input and XML structure.
- Keep XML parsing libraries updated.

#### 4.1.4 LDAP Injection

LDAP Injection occurs when untrusted input changes the structure of an LDAP query.

LDAP, or Lightweight Directory Access Protocol, is commonly used to access directory information such as user accounts and organizational records.

If an application constructs LDAP filters directly from user input, an attacker may manipulate the filter and potentially bypass intended restrictions.

**How to prevent LDAP Injection:**

- Use APIs that safely construct LDAP queries.
- Escape special characters according to the LDAP filter or distinguished-name context.
- Validate input based on the expected data format.
- Apply appropriate access controls to directory services.

### 4.2 Broken Authentication

Broken Authentication refers to weaknesses in how an application verifies identities, manages sessions, or handles authentication credentials.

Examples include:

- Using weak or easily guessed passwords.
- Failing to implement appropriate protections against repeated login attempts.
- Storing passwords in plain text.
- Using predictable session identifiers.
- Failing to invalidate sessions after logout or account security changes.
- Implementing password-reset functionality insecurely.
- Failing to protect authentication tokens.

**How to prevent authentication vulnerabilities:**

- Use a trusted authentication framework where possible.
- Store passwords using a suitable password-hashing algorithm, such as Argon2id.
- Implement rate limiting and appropriate protections against credential-stuffing attacks.
- Use multi-factor authentication when appropriate.
- Generate session identifiers using cryptographically secure randomness.
- Use secure cookie settings, including `HttpOnly`, `Secure`, and an appropriate `SameSite` policy.
- Invalidate sessions when necessary, particularly after logout or sensitive account changes.
- Protect password-reset tokens and ensure they expire appropriately.

### 4.3 Sensitive Data Exposure and Cryptographic Failures

Sensitive data exposure occurs when an application fails to adequately protect confidential information.

Examples include:

- Storing passwords in plain text.
- Sending sensitive information over unencrypted connections.
- Exposing API keys in frontend code.
- Returning unnecessary personal information in API responses.
- Storing encryption keys alongside the data they protect.
- Logging passwords, authentication tokens, or payment information.

Modern OWASP terminology uses **Cryptographic Failures** for the broader risk category covering inadequate protection of sensitive data.

**How to protect sensitive data:**

- Use HTTPS for data transmitted over the network.
- Use suitable encryption for sensitive data stored at rest when needed.
- Hash passwords using an appropriate password-hashing algorithm.
- Keep encryption keys and secrets separate from application source code.
- Store secrets in an appropriate secrets manager or protected configuration system.
- Limit access to sensitive information.
- Collect and retain only the data the application actually needs.
- Avoid logging sensitive information unnecessarily.

**Important distinction:**

Encryption is reversible when the appropriate key is available. Password hashing is designed to be one-way, which is why passwords should generally be hashed rather than encrypted for storage.

### 4.4 Cross-Site Scripting (XSS)

Cross-Site Scripting occurs when an application causes untrusted content to execute as script in another user's browser.

This can happen when user-controlled content is inserted into a webpage without appropriate handling for its output context.

For example, an application may display comments submitted by users. If it renders untrusted HTML unsafely, an attacker may be able to execute JavaScript in another user's browser.

Potential consequences include:

- Access to information exposed to scripts running in the affected page.
- Performing actions as the victim through the vulnerable application.
- Manipulating webpage content.
- Stealing session information when that information is accessible to the script.

**Common types of XSS:**

- **Stored XSS:** Malicious content is stored by the application and later displayed to users.
- **Reflected XSS:** Malicious input is included in a response, often after being supplied through a request.
- **DOM-based XSS:** Client-side JavaScript processes untrusted data in an unsafe way, resulting in script execution.

**How to prevent XSS:**

- Use framework features that safely escape output by default.
- Avoid inserting untrusted strings into HTML using unsafe APIs such as `innerHTML`.
- Use `textContent` when displaying plain text in the browser.
- Apply context-appropriate output encoding.
- Sanitize HTML when the application intentionally allows users to submit HTML.
- Use Content Security Policy (CSP) as an additional defense.
- Avoid disabling framework security features without a clear and safe reason.

**Key takeaway:** Input validation is useful, but safe output handling is essential for preventing XSS.

### 4.5 Security Misconfiguration

Security Misconfiguration occurs when a server, application, database, framework, or cloud service is configured insecurely.

Examples include:

- Leaving debugging enabled in production.
- Exposing detailed error messages or stack traces.
- Using default administrator credentials.
- Leaving unnecessary services enabled.
- Allowing directory listings when they are not needed.
- Setting overly permissive CORS policies.
- Exposing administrative interfaces publicly without adequate protection.
- Leaving outdated software or unnecessary components installed.

**How to prevent security misconfiguration:**

- Use secure configuration defaults.
- Disable debugging and development-only features in production.
- Remove unnecessary services and components.
- Change default credentials.
- Restrict administrative interfaces.
- Review access permissions regularly.
- Keep dependencies, frameworks, and server software updated.
- Apply consistent security configurations across development, testing, and production environments.

### 4.6 Cross-Site Request Forgery (CSRF)

Cross-Site Request Forgery occurs when an attacker tricks a user's browser into sending an unwanted request to an application where the user is already authenticated.

This is particularly relevant when the application automatically attaches authentication cookies to requests.

For example, a user may be logged in to an online banking application. If the application does not adequately protect a sensitive operation, an attacker may attempt to make the user's browser submit an unwanted request.

The request may be sent with the user's existing authentication cookies, depending on the browser and cookie settings.

**How to prevent CSRF:**

- Use anti-CSRF tokens for state-changing requests where appropriate.
- Configure cookies with an appropriate `SameSite` policy.
- Validate the `Origin` or, where appropriate, `Referer` header as an additional defense.
- Require reauthentication for particularly sensitive operations when appropriate.
- Never use GET requests to perform state-changing operations.
- Do not rely on CORS alone as a CSRF defense.

**Important distinction:** CSRF and XSS are different vulnerabilities. CSRF abuses the browser's authenticated request behavior, while XSS involves unsafe script execution in the context of a website.

### 4.7 Insecure Direct Object Reference (IDOR)

IDOR is an authorization vulnerability in which an application allows a user to access or modify an object they are not authorized to access.

It is commonly associated with insecure access to records identified by IDs in URLs, API endpoints, or request parameters.

For example:

```text
GET /api/users/101/profile
GET /api/users/102/profile
```

Suppose user `101` is authenticated and authorized to view their own profile.

If the application accepts a request for user `102` and returns that user's private information without checking permissions, the application has an authorization vulnerability.

The problem is not that the ID is easy to guess. The problem is that the server fails to verify whether the requesting user is authorized to access the requested object.

**How to prevent IDOR:**

- Perform authorization checks on the server for every protected resource.
- Verify that the authenticated user has permission to perform the requested operation on the specific object.
- Apply access-control rules consistently across read, update, and delete operations.
- Avoid relying on frontend restrictions or hidden IDs as security controls.
- Test access to resources belonging to other users.
- Use indirect or random identifiers where useful, but never treat them as a replacement for authorization.

**Key takeaway:** Knowing an object's identifier does not mean a user is authorized to access it.

### 4.8 Additional Security Risks Developers Should Understand

The original list contains seven main categories if Injection is counted as one. These additional risks are also important in modern web applications.

#### Broken Access Control

Broken Access Control occurs when users can perform actions or access resources outside their intended permissions.

Examples include:

- A regular user accessing an administrator-only endpoint.
- A user editing another user's profile.
- A user modifying an order that belongs to someone else.
- A user accessing a restricted resource by directly calling an API.

IDOR is one example of an access-control vulnerability.

**Prevention:** Enforce authorization on the server for every protected operation and default to denying access unless permission is established.

#### Security Vulnerabilities in Dependencies

Modern web applications rely on external libraries, frameworks, and packages. Vulnerabilities in these dependencies can affect the application even if its own code is written securely.

**Prevention:**

- Keep dependencies updated.
- Remove unused packages.
- Monitor security advisories.
- Use dependency-scanning tools.
- Review and test security updates before deploying them.

#### Server-Side Request Forgery (SSRF)

SSRF occurs when an application makes server-side requests based on untrusted input and an attacker can influence the destination.

For example, an application that fetches a URL supplied by a user may be abused to request internal services that should not be publicly accessible.

**Prevention:**

- Avoid accepting arbitrary URLs when possible.
- Allowlist permitted destinations.
- Validate destination addresses and restrict access to internal networks.
- Configure outbound network access appropriately.
- Revalidate destinations after redirects and account for DNS resolution risks.

## 5. A Developer's Security Checklist

Security should be considered throughout the development lifecycle, not only after the application is complete.

### Authentication and Authorization

- [ ] Use a secure authentication mechanism.
- [ ] Store passwords using an appropriate password-hashing algorithm.
- [ ] Protect session identifiers and authentication tokens.
- [ ] Verify permissions on the server for every protected operation.
- [ ] Test whether users can access other users' resources.

### Input and Output Handling

- [ ] Validate user input according to the expected format.
- [ ] Use parameterized database queries.
- [ ] Avoid unsafe shell command execution.
- [ ] Escape output according to its context.
- [ ] Avoid rendering untrusted HTML without proper sanitization.

### Data Protection

- [ ] Use HTTPS.
- [ ] Protect sensitive information stored in databases and files.
- [ ] Never store passwords in plain text.
- [ ] Keep API keys and secrets out of frontend code and source repositories.
- [ ] Avoid exposing sensitive data in logs and error messages.

### Application Configuration

- [ ] Disable debugging in production.
- [ ] Remove default credentials and unnecessary services.
- [ ] Configure security headers appropriately.
- [ ] Keep frameworks, libraries, and server software updated.
- [ ] Restrict administrative interfaces and sensitive endpoints.

### Testing and Monitoring

- [ ] Test authentication and authorization boundaries.
- [ ] Use static analysis and dependency-scanning tools.
- [ ] Review logs for suspicious activity without logging secrets.
- [ ] Back up important data and test recovery procedures.
- [ ] Perform security testing before major releases.

## 6. Final Takeaways

Web security is not limited to ethical hackers or security specialists. Every developer who writes frontend code, backend services, database queries, or API endpoints contributes to the security of an application.

Remember these fundamental rules:

1. Never trust user input without appropriate validation and handling.
2. Use parameterized queries to prevent SQL injection.
3. Avoid unsafe execution of operating system commands.
4. Authenticate users and authorize every protected operation.
5. Protect sensitive information throughout its lifecycle.
6. Use safe output handling to prevent XSS.
7. Protect state-changing requests against CSRF where applicable.
8. Keep application configurations and dependencies secure.
9. Apply the principle of least privilege.
10. Test security continuously rather than treating it as a one-time task.

> [!CAUTION]
> **Treat user input as untrusted.**
>
> This does not mean that every user is malicious. It means that the application must never assume incoming data is safe simply because it comes from a form, an authenticated user, a frontend application, or a trusted-looking source.
>
> Security decisions must be enforced by the server, and untrusted data must be handled using the appropriate security controls.

The goal is not to make development unnecessarily complicated. The goal is to build applications that work correctly while protecting their users, data, and infrastructure.

## Recommended learning resources

To continue learning after the workshop, these are good starting points:

-   OWASP — [Official website](https://owasp.org/?utm_source=chatgpt.com) for application security guidance and projects.
    
-   [OWASP Top 10](https://owasp.org/www-project-top-ten/?utm_source=chatgpt.com) — Learn about the major categories of web application security risks.
    
-   [PortSwigger Web Security Academy](https://portswigger.net/web-security?utm_source=chatgpt.com) — Free, interactive lessons and practice labs for understanding vulnerabilities in a controlled environment.
    
-   [OWASP Cheat Sheet Series](https://cheatsheetseries.owasp.org/?utm_source=chatgpt.com) — Practical secure coding recommendations for developers.
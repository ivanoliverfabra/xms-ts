# XMS‑TS

**XMS‑TS** is a TypeScript implementation of **XMS (eXchange Metadata Standard)**:  
a lightweight, flat `key=value;...` string format for attaching metadata to transactions (or other content).

This library provides:

- ✅ A **strict parser/serializer** for compliant `xms/N;...` metadata strings.
- ✅ A **fallback parser** that handles non‑XMS `key=value;...` strings gracefully.
- ✅ A strongly‑typed **XMSDoc** wrapper with convenient getters/setters.
- ✅ **Type‑level safety** with support for dotted keys expanding into nested object types.
- ✅ Both **nested** and **flattened** key access for maximum flexibility.

---

## 📦 Install

```bash
npm i xms-ts
# or
yarn add xms-ts
# or
pnpm add xms-ts
# or
bun add xms-ts
```

---

## 🚀 Getting Started

### Parse a strict XMS string

```ts
import { XMSDoc } from "xms-ts";

const doc = XMSDoc.parse("xms/1;username=fabra;ref.item=sword");

console.log(doc.version); // 1       (typed number literal)
console.log(doc.isFallback); // false (typed boolean literal)
console.log(doc.username); // "fabra"
console.log(doc.data.ref.item); // "sword"
console.log(doc.data["ref.item"]); // "sword" (flattened access)

// entries are type-safe
for (const e of doc.entries) {
  console.log(e.name, e.value);
}
```

### Parse a non‑XMS string (fallback)

```ts
const fb = XMSDoc.parse("username=fabra;ref.item=sword");

console.log(fb.version); // 0
console.log(fb.isFallback); // true
console.log(fb.username); // "fabra"
console.log(fb.ref.item); // "sword"
console.log(fb.data.ref.item); // "sword"
```

### Create documents programmatically

```ts
const doc = XMSDoc.from({ username: "fabra", "ref.item": "sword" }, 2);

console.log(doc.version); // 2
console.log(doc.isFallback); // false
console.log(doc.data.username); // string
console.log(doc.data.ref.item); // string
```

### Structured errors

```ts
const doc = XMSDoc.parse(
  "xms/1;error.code=E404;error.message=Not Found;error.type=validation"
);

console.log(doc.error); // { code:"E404", message:"Not Found", type:"validation" }
```

### Round‑trip serialization

```ts
const str = "xms/1;username=fabra;ref.item=axe";
const doc = XMSDoc.parse(str);

console.log(doc.toString() === str); // true
```

---

## ⚡ Key Features

- **Strict Spec Compliance**  
  Works exactly with XMS v1.0 spec (quoted values, escaping, nested namespaces).

- **Fallback Parser**  
  If input isn’t strict (`xms/…` missing), still parsed into `entries` and `data`.

- **Type Safety**

  - Literal input → compile‑time types for `.version`, `.isFallback`, `.data`.
  - Generic overrides (`XMSDoc.parse<{…}>`) expand dotted keys into nested objects.
  - `XMSDoc.from` does the same for programmatic creation.

- **Both Nested + Flattened Access**  
  Access values with either:

  ```ts
  doc.data.ref.item;
  doc.data["ref.item"];
  ```

- **Entries API**  
  Iterate flat key/value pairs via `.entries`.

---

## 📝 License

MIT © 2025 — Ivan Oliver Fabra

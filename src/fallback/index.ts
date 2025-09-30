import { parseXMS } from "../parser/xms-core.js";
import { XMSParseError, type FallbackResult, type MetadataEntry, type MetadataResult, type ValidXMSPrimitive } from "../types/index.js";

function flattenNamespace(
  baseKey: string,
  obj: Record<string, any>,
  entries: MetadataEntry[],
  fb: any
) {
  for (const [k, v] of Object.entries(obj)) {
    const dotted = baseKey ? `${baseKey}.${k}` : k
    if (v != null && typeof v === "object" && !Array.isArray(v)) {
      if (!fb[k] || typeof fb[k] !== "object") fb[k] = {}
      flattenNamespace(dotted, v, entries, fb[k])
    } else {
      entries.push({ name: dotted, value: String(v) })
      fb[dotted] = v
      fb[k] = v
    }
  }
}

export function fallbackParse<D extends Record<string, ValidXMSPrimitive>>(raw: string): FallbackResult<D> {
  const result = { entries: [] } as any as FallbackResult<D>

  if (!raw || raw.length === 0) return result

  const entries: MetadataEntry[] = raw
    .split(";")
    .map((entry) => entry.split("="))
    .filter(([name]) => name && name.trim().length > 0)
    .map(([name, value]) => ({
      name: (name ?? "").trim(),
      value: (value ?? "").trim(),
    }))

  result.entries = entries

  for (const { name, value } of entries) {
    switch (name.toLowerCase()) {
      case "username":
        result.username = String(value)
        break
      case "useruuid":
        result.useruuid = String(value)
        break
      case "message":
        result.message = String(value)
        break
      case "error":
        result.error = String(value)
        break
      default:
        (result as any)[name] = value
        break
    }
  }

  return result
}

export function setNested(root: Record<string, any>, path: string[], value: any) {
  let current = root
  for (let i = 0; i < path.length - 1; i++) {
    const key = path[i]!
    if (!current[key] || typeof current[key] !== "object") {
      current[key] = {}
    }
    current = current[key]
  }
  current[path[path.length - 1]!] = value
}

export function safeParseMetadata<
  D extends Record<string, ValidXMSPrimitive> = Record<string, ValidXMSPrimitive>
>(raw: string): MetadataResult<D> {
  if (!raw || raw.length === 0) {
    return {
      entries: [],
      fallback: { entries: [], ref: {} },
    } as unknown as MetadataResult<D>
  }

  try {
    const xmsDoc = parseXMS<D>(raw, true)
    const entries: MetadataEntry[] = []
    const fb: any = { entries, ref: {} }

    // reserved
    if (xmsDoc.data.username) {
      entries.push({ name: "username", value: xmsDoc.data.username })
      fb.username = xmsDoc.data.username
    }
    if (xmsDoc.data.useruuid) {
      entries.push({ name: "useruuid", value: xmsDoc.data.useruuid })
      fb.useruuid = xmsDoc.data.useruuid
    }
    if (xmsDoc.data.message) {
      entries.push({ name: "message", value: xmsDoc.data.message })
      fb.message = xmsDoc.data.message
    }

    // refs (recursive)
    if (xmsDoc.data.ref) {
      flattenNamespace("ref", xmsDoc.data.ref, entries, fb.ref)
    }

    // errors (recursive)
    if (xmsDoc.data.error != null) {
      if (typeof xmsDoc.data.error === "string") {
        entries.push({ name: "error", value: xmsDoc.data.error })
        fb.error = xmsDoc.data.error
      } else {
        fb.error = {}
        flattenNamespace("error", xmsDoc.data.error, entries, fb.error)
      }
    }

    // arbitrary extensions (recursive)
    for (const [k, v] of Object.entries(xmsDoc.data)) {
      if (["username", "useruuid", "message", "ref", "error"].includes(k))
        continue
      if (v == null) continue

      if (typeof v === "object" && !Array.isArray(v)) {
        if (!fb[k]) fb[k] = {}
        flattenNamespace(k, v as Record<string, any>, entries, fb[k])
      } else {
        entries.push({ name: k, value: String(v) })
        fb[k] = v
      }
    }

    return { entries, xms: xmsDoc, fallback: fb } as unknown as MetadataResult<D>
  } catch (err) {
    if (err instanceof XMSParseError) {
      const fallback = fallbackParse(raw)
      // make sure fallback always has `ref`
      if (!("ref" in fallback)) {
        ; (fallback as any).ref = {}
      }
      return { entries: fallback.entries, fallback } as unknown as MetadataResult<D>
    }
    throw err
  }
}
import type { MetadataEntry } from "../types"

export function flattenNamespace(
  baseKey: string,
  obj: Record<string, any>,
  entries: MetadataEntry[],
  fb?: Record<string, any>
) {
  for (const [k, v] of Object.entries(obj)) {
    const dotted = baseKey ? `${baseKey}.${k}` : k
    if (v != null && typeof v === "object" && !Array.isArray(v)) {
      if (fb) {
        if (!fb[k] || typeof fb[k] !== "object") fb[k] = {}
      }
      flattenNamespace(dotted, v, entries, fb ? fb[k] : undefined)
    } else {
      entries.push({ name: dotted, value: String(v) })
      if (fb) {
        fb[k] = v
      }
    }
  }
}
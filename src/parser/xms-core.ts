import { type ValidXMSPrimitive, type XMSDocument, XMSParseError } from "../types/core.js"
import { splitTokens } from "./tokenizer.js"

const QUOTED = Symbol("quoted-value")
type QuotedString = string & { [QUOTED]: true }

function makeQuoted(value: string): QuotedString {
  return Object.assign(new String(value), { [QUOTED]: true }) as any
}
function isQuoted(value: any): value is QuotedString {
  return (
    value != null &&
    typeof value === "object" &&
    (value as any)[QUOTED] === true
  )
}

function decodeValue(rawValue: string, strict = true): string | QuotedString {
  if (!rawValue) return ""
  if (rawValue.startsWith('"') && rawValue.endsWith('"')) {
    const body = rawValue.slice(1, -1)
    const unquoted = body.replace(/\\(["\\])/g, "$1")
    return makeQuoted(unquoted)
  }
  if (/\\/.test(rawValue)) {
    if (strict && /\\[^;=\\"]/.test(rawValue)) {
      throw new XMSParseError(`Invalid escape sequence: ${rawValue}`)
    }
    return rawValue.replace(/\\([;=\\"])/g, "$1")
  }
  if (/[;="\\]/.test(rawValue)) throw new XMSParseError(`Invalid plain value: ${rawValue}`)
  if (strict && /\s/.test(rawValue)) throw new XMSParseError(`Whitespace not allowed: ${rawValue}`)
  return rawValue
}

function encodeValue(value: string | QuotedString): string {
  if (value === "") return '""'
  if (isQuoted(value)) {
    return `"${String(value).replace(/(["\\])/g, "\\$1")}"`
  }
  if (/^[A-Za-z0-9_.-]+$/.test(String(value))) return String(value)
  return `"${String(value).replace(/(["\\])/g, "\\$1")}"`
}

function flatten(prefix: string, obj: Record<string, unknown>, out: [string, any][]) {
  for (const [k, v] of Object.entries(obj)) {
    if (v == null) continue
    const newKey = prefix ? `${prefix}.${k}` : k
    if (typeof v === "object" && !isQuoted(v)) flatten(newKey, v as Record<string, unknown>, out)
    else out.push([newKey, v])
  }
}

function setNested(root: Record<string, unknown>, path: string[], value: string) {
  let current: Record<string, unknown> = root
  for (let i = 0; i < path.length - 1; i++) {
    const key = path[i]
    if (!key?.trim()) return
    if (!(key in current) || typeof current[key] !== "object" || current[key] === null) {
      current[key] = {}
    }
    current = current[key] as Record<string, unknown>
  }
  const leaf = path[path.length - 1]
  if (leaf?.trim()) current[leaf] = value
}

export function parseXMS<D extends Record<string, ValidXMSPrimitive> = Record<string, ValidXMSPrimitive>>(
  input: string,
  strict = true
): XMSDocument<D> {
  if (!input.startsWith("xms/")) throw new XMSParseError("Missing version marker")
  const [versionPart, ...rest] = splitTokens(input)
  const versionString = versionPart?.trim()
  if (!versionString) throw new XMSParseError("Empty version marker")
  const versionMatch = /^xms\/(\d+)$/.exec(versionString)
  if (!versionMatch) throw new XMSParseError(`Invalid version marker: ${versionString}`)
  const version = parseInt(versionMatch[1] as string, 10)

  const data: XMSDocument["data"] = {}
  for (const token of rest) {
    const pair = token.trim()
    if (!pair) continue
    const eqIndex = pair.indexOf("=")
    if (eqIndex === -1) throw new XMSParseError(`Missing '=' in ${pair}`)

    const rawKey = pair.slice(0, eqIndex)
    if (strict && /\s/.test(rawKey)) throw new XMSParseError(`Whitespace not allowed in key: ${rawKey}`)
    if (!/^[a-z0-9_.]+$/.test(rawKey)) throw new XMSParseError(`Invalid key casing: ${rawKey}`)

    const key = rawKey.toLowerCase()
    const rawValue = pair.slice(eqIndex + 1)
    const value = decodeValue(rawValue, strict)
    const parts = key.split(".")

    switch (parts[0]) {
      case "ref":
        if (!data.ref) data.ref = {}
        setNested(data.ref, parts.slice(1), value.toString())
        break
      case "error":
        if (parts.length === 1) data.error = value.toString()
        else {
          if (!data.error || typeof data.error === "string") data.error = {}
            ; (data.error as any)[parts.slice(1).join(".")] = value.toString()
        }
        break
      default:
        setNested(data, parts, value.toString())
        break
    }
  }
  return { version, data } as XMSDocument<D>
}

export function toXMS(doc: XMSDocument): string {
  if (!doc || typeof doc.version !== "number") throw new XMSParseError("Invalid document")
  const out: [string, any][] = []
  const d = doc.data
  if (d.username !== undefined) out.push(["username", d.username])
  if (d.useruuid !== undefined) out.push(["useruuid", d.useruuid])
  if (d.message !== undefined) out.push(["message", d.message])
  if (d.ref) flatten("ref", d.ref, out)
  if (d.error) {
    if (typeof d.error === "string") out.push(["error", d.error])
    else flatten("error", d.error, out)
  }
  for (const [k, v] of Object.entries(d)) {
    if (["username", "useruuid", "message", "ref", "error"].includes(k)) continue
    if (v == null) continue
    if (typeof v === "object") flatten(k, v as any, out)
    else out.push([k, v])
  }
  return [`xms/${doc.version}`, ...out.map(([k, v]) => `${k}=${encodeValue(v)}`)].join(";")
}
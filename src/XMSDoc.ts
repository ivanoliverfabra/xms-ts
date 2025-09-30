import { flattenNamespace } from "./fallback/flatten.js"
import { fallbackParse, setNested } from "./fallback/index.js"
import { parseXMS, toXMS } from "./parser/xms-core.js"
import { XMSParseError, type XMSDocument } from "./types/core.js"
import type { MetadataEntry } from "./types/entries.js"
import type { EntriesFromData, ExpandShape, ExtractRef, FallbackResult, InferIsFallback, InferVersion, ParseXMS, XMSErrorDetail } from "./types/index.js"

export class XMSDoc<T extends XMSDocument = XMSDocument> {
  private readonly _doc?: T
  private readonly _fallback?: FallbackResult

  constructor(doc?: T, fallback?: FallbackResult) {
    this._doc = doc
    this._fallback = fallback
  }

  static parse<S extends string>(
    input: S,
    strict?: true
  ): XMSDoc<ParseXMS<S>> & {
    entries: EntriesFromData<ParseXMS<S>["data"]>[]
  }
  static parse<TShape extends Record<string, any>>(
    input: string,
    strict?: true
  ): XMSDoc<{ version: 0; isFallback: true; data: ExpandShape<TShape> }> & {
    entries: EntriesFromData<ExpandShape<TShape>>[]
  }
  static parse(
    input: string,
    strict?: boolean
  ): XMSDoc<{ version: 0; isFallback: true; data: FallbackResult }>
  static parse(input: string, strict = true): any {
    try {
      const parsed = parseXMS(input, strict)
      return new XMSDoc(parsed)
    } catch (err) {
      if (err instanceof XMSParseError) {
        if (input.startsWith("xms/") && strict) throw err
        const fb = fallbackParse(input)
        return new XMSDoc(undefined, fb)
      }
      throw err
    }
  }

  static from<
    TData extends Record<string, any>,
    TVersion extends number = 1
  >(
    data: TData,
    version?: TVersion,
    strict = true
  ): XMSDoc<{
    version: TVersion
    isFallback: false
    data: ExpandShape<TData>
  }> & {
    entries: EntriesFromData<ExpandShape<TData>>[]
  } {
    try {
      return new XMSDoc(
        {
          version: (version ?? 1) as TVersion,
          isFallback: false,
          data: data as ExpandShape<TData>
        } as any
      ) as any
    } catch (err) {
      if (strict) throw err
      const fb = fallbackParse(Object.entries(data).map(([k, v]) => ({ name: k, value: String(v) })).join(";"))
      return new XMSDoc(undefined, fb) as any
    }
  }

  get isFallback(): InferIsFallback<T> {
    return (!!this._fallback && !this._doc) as InferIsFallback<T>
  }

  get version(): InferVersion<T> {
    return (this._doc?.version ?? 0) as InferVersion<T>
  }

  get data(): T["data"] {
    const obj: Record<string, any> = { ref: {} }

    if (this._doc) {
      // Strict: copy original structured
      for (const [k, v] of Object.entries(this._doc.data)) {
        if (v == null) continue
        if (typeof v === "object" && !Array.isArray(v)) {
          // recurse down into object to add dotted keys
          const addNested = (prefix: string, o: any) => {
            for (const [kk, vv] of Object.entries(o)) {
              if (vv != null && typeof vv === "object" && !Array.isArray(vv)) {
                addNested(`${prefix}.${kk}`, vv)
              } else {
                obj[`${prefix}.${kk}`] = vv
                setNested(obj, `${prefix}.${kk}`.split("."), vv)
              }
            }
          }
          addNested(k, v)
          obj[k] = v // keep structured
        } else {
          obj[k] = v
        }
      }
      return obj as any
    }

    // Fallback: reconstruct both nested + dotted
    this._fallback?.entries.forEach((e) => {
      const path = e.name.split(".")
      setNested(obj, path, e.value)
      obj[e.name] = e.value
    })
    return obj as any
  }

  get entries(): MetadataEntry[] {
    if (this._doc) {
      const arr: MetadataEntry[] = []
      // reserved
      if (this._doc.data.username)
        arr.push({ name: "username", value: this._doc.data.username })
      if (this._doc.data.useruuid)
        arr.push({ name: "useruuid", value: this._doc.data.useruuid })
      if (this._doc.data.message)
        arr.push({ name: "message", value: this._doc.data.message })

      if (this._doc.data.ref) {
        flattenNamespace("ref", this._doc.data.ref, arr)
      }
      if (this._doc.data.error != null) {
        if (typeof this._doc.data.error === "string") {
          arr.push({ name: "error", value: this._doc.data.error })
        } else {
          flattenNamespace("error", this._doc.data.error, arr)
        }
      }

      for (const [k, v] of Object.entries(this._doc.data)) {
        if (["username", "useruuid", "message", "ref", "error"].includes(k)) continue
        if (v == null) continue

        if (typeof v === "object" && !Array.isArray(v)) {
          flattenNamespace(k, v as Record<string, any>, arr)
        } else {
          arr.push({ name: k, value: String(v) })
        }
      }
      return arr
    }

    return this._fallback?.entries ?? []
  }

  get username(): string | undefined {
    return this._doc?.data.username ?? this._fallback?.username
  }

  get useruuid(): string | undefined {
    return this._doc?.data.useruuid ?? this._fallback?.useruuid
  }

  get message(): string | undefined {
    return this._doc?.data.message ?? this._fallback?.message
  }

  get ref(): ExtractRef<T["data"]> {
    if (this._doc) {
      return this._doc.data.ref as ExtractRef<T["data"]>
    }
    if (this._fallback) {
      // fallback mode reconstructs nested ref object
      return (this.data as any).ref as ExtractRef<T["data"]>
    }
    return {} as ExtractRef<T["data"]>
  }

  get error(): string | XMSErrorDetail | undefined {
    return this._doc?.data.error ?? this._fallback?.error
  }

  set<K extends keyof T["data"]>(key: K, value: T["data"][K]): this {
    if (!this._doc) throw new Error("Cannot set() on fallback document")
    this._doc.data[key as string] = value
    return this
  }

  setRef(key: string, value: string): this {
    if (!this._doc) throw new Error("Cannot setRef() on fallback document")
    if (!this._doc.data.ref) this._doc.data.ref = {}
    this._doc.data.ref[key] = value
    return this
  }

  setError(message: string): this
  setError(code: string, message?: string, type?: string): this
  setError(codeOrMsg: string, message?: string, type?: string): this {
    if (!this._doc) throw new Error("Cannot setError() on fallback document")
    if (message === undefined && type === undefined) {
      this._doc.data.error = codeOrMsg
    } else {
      if (!this._doc.data.error || typeof this._doc.data.error === "string") {
        this._doc.data.error = {}
      }
      const err = this._doc.data.error as XMSErrorDetail
      if (message !== undefined) err.message = message
      if (type !== undefined) err.type = type
      if (codeOrMsg) err.code = codeOrMsg
    }
    return this
  }

  toString(): string {
    if (this._doc) {
      return toXMS(this._doc)
    }
    return this.entries.map((e) => `${e.name}=${e.value}`).join(";")
  }

  toJSON(): XMSDocument<Record<string, any>> {
    if (this._doc) {
      return this._doc as XMSDocument<Record<string, any>>
    }
    const data: Record<string, any> = {}
    this._fallback?.entries.forEach((e) => {
      data[e.name] = e.value
    })
    return {
      version: 0,
      data
    }
  }

  static toXMS(doc: XMSDoc): string {
    if (!doc._doc) throw new Error("Cannot serialize fallback document to XMS")
    return toXMS(doc._doc)
  }
}

export default { XMSDoc }
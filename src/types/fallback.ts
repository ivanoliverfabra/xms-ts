import type { XMSDocument, XMSErrorDetail, XMSValue } from "./core.js"
import type { MetadataEntry } from "./entries.js"

export type FallbackResult<
  D extends Record<string, XMSValue> = Record<string, XMSValue>
> = {
  entries: MetadataEntry[]
  username?: string
  useruuid?: string
  message?: string
  error?: string | XMSErrorDetail
  ref?: Record<string, XMSValue>
  [key: string]: XMSValue | MetadataEntry[] | undefined
} & D

export interface MetadataResult<
  D extends Record<string, XMSValue> = Record<string, XMSValue>
> {
  entries: MetadataEntry[]
  xms?: XMSDocument<D>
  fallback: FallbackResult<D>
}
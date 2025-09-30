import type { XMSErrorDetail, XMSValue } from "./core.js"

type ReservedKeyMap = {
  username: string
  useruuid: string
  message: string
  error: string | XMSErrorDetail
}

type ReservedEntries =
  { [K in keyof ReservedKeyMap]: { name: K; value: ReservedKeyMap[K] } }[keyof ReservedKeyMap]

export type RefEntry<K extends string = string> = {
  name: `ref.${K}`
  value: XMSValue
}

export type ErrorEntry<K extends string = string> =
  K extends "code" | "message" | "type"
  ? { name: `error.${K}`; value: string }
  : { name: `error.${K}`; value: string }

export type GenericEntry<K extends string = string> = {
  name: K
  value: XMSValue
}

export type MetadataEntry =
  | ReservedEntries
  | RefEntry
  | ErrorEntry
  | GenericEntry
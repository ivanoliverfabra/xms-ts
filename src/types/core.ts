export interface XMSErrorDetail {
  code?: string
  message?: string
  type?: string
  [key: string]: string | undefined
}

export type ValidXMSPrimitive = string | number | boolean | null

export type XMSValue =
  | ValidXMSPrimitive
  | XMSValue[]
  | { [key: string]: XMSValue }
  | XMSErrorDetail

export interface XMSDocument<T = Record<string, XMSValue>> {
  version: number
  data: {
    username?: string
    useruuid?: string
    message?: string
    ref?: Record<string, XMSValue>
    error?: string | XMSErrorDetail
    [key: string]: XMSValue | undefined
  } & T
}

export class XMSParseError extends Error {
  constructor(message: string) {
    super(`XMS Parse Error: ${message}`)
  }
}
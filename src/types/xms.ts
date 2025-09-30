
type Split<S extends string, Sep extends string> =
  S extends `${infer A}${Sep}${infer B}` ? [A, ...Split<B, Sep>] : [S]

type ExpandKey<K extends string, V> =
  K extends `${infer Head}.${infer Rest}`
  ? { [P in Head]: ExpandKey<Rest, V> }
  : { [P in K]: V }

type Merge<A, B> = {
  [K in keyof A | keyof B]:
  K extends keyof A
  ? K extends keyof B
  ? Merge<A[K], B[K]>
  : A[K]
  : K extends keyof B
  ? B[K]
  : never
}

export type ExpandShape<T> = {
  [K in keyof T as K extends `${infer Head}.${infer Rest}` ? Head : K]:
  K extends `${infer Head}.${infer Rest}`
  ? ExpandShape<{ [P in Rest]: T[K] }>
  : T[K]
} & {}

export type EntriesFromData<T, Prefix extends string = ""> = {
  [K in keyof T & string]:
  T[K] extends object
  ? EntriesFromData<T[K], `${Prefix}${K}.`>
  : { name: `${Prefix}${K}`; value: T[K] }
}[keyof T & string]

type KVPair<S extends string> =
  S extends `${infer K}=${infer V}` ? ExpandKey<K, V> : {}

type ParseEntries<S extends readonly string[]> =
  S extends [infer First extends string, ...infer Rest extends string[]]
  ? Merge<KVPair<First>, ParseEntries<Rest>>
  : {}

export type ParseXMS<S extends string> =
  S extends `xms/${infer V extends number};${infer Rest}`
  ? { version: V; isFallback: false; data: ParseEntries<Split<Rest, ";">> }
  : S extends `xms/${infer V extends number}`
  ? { version: V; isFallback: false; data: {} }
  : { version: 0; isFallback: true; data: ParseEntries<Split<S, ";">> }

export type ExtractRef<T> = T extends { ref: infer R } ? R : Record<string, any>

export type InferVersion<T> = T extends { version: infer V } ? V : 0
export type InferIsFallback<T> = T extends { isFallback: infer F } ? F : true
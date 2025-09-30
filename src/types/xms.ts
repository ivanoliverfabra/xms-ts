type Split<
  S extends string,
  Sep extends string,
  Depth extends number = 0
> = Depth extends 15
  ? [S]
  : S extends `${infer A}${Sep}${infer B}`
  ? [A, ...Split<B, Sep, _Inc<Depth>>]
  : [S];

type _Inc<N extends number> =
  N extends 0 ? 1 : N extends 1 ? 2 : N extends 2 ? 3 : N extends 3 ? 4 : N extends 4 ? 5 :
  N extends 5 ? 6 : N extends 6 ? 7 : N extends 7 ? 8 : N extends 8 ? 9 : N extends 9 ? 10 :
  N extends 10 ? 11 : N extends 11 ? 12 : N extends 12 ? 13 : N extends 13 ? 14 : N extends 14 ? 15 : 15;

type ExpandKey<K extends string, V, Depth extends number = 0> =
  Depth extends 10
  ? { [P in K]: V }
  : K extends `${infer Head}.${infer Rest}`
  ? { [P in Head]: ExpandKey<Rest, V, _Inc<Depth>> }
  : { [P in K]: V };

type Merge<A, B> = {
  [K in keyof (A & B)]: K extends keyof A ? K extends keyof B ? A[K] & B[K] : A[K] : K extends keyof B ? B[K] : never;
} & {};

export type ExpandShape<T, Depth extends number = 0> = Depth extends 10
  ? T
  : {
    [K in keyof T as K extends `${infer Head}.${infer Rest}` ? Head : K]:
    K extends `${infer Head}.${infer Rest}`
    ? ExpandShape<{ [P in Rest]: T[K] }, _Inc<Depth>>
    : T[K];
  } & {};

export type EntriesFromData<T, Prefix extends string = "", Depth extends number = 0> =
  Depth extends 10
  ? { name: `${Prefix}${keyof T & string}`; value: T[keyof T] }
  : {
    [K in keyof T & string]:
    T[K] extends object
    ? EntriesFromData<T[K], `${Prefix}${K}.`, _Inc<Depth>>
    : { name: `${Prefix}${K}`; value: T[K] };
  }[keyof T & string];

type KVPair<S extends string> =
  S extends `${infer K}=${infer V}` ? ExpandKey<K, V> : {};

type ParseEntries<
  S extends readonly string[],
  Depth extends number = 0
> = Depth extends 15
  ? {}
  : S extends readonly [infer First extends string, ...infer Rest extends readonly string[]]
  ? Merge<KVPair<First>, ParseEntries<Rest, _Inc<Depth>>>
  : {};

export type ParseXMS<S extends string> =
  string extends S
  ? { version: number; isFallback: boolean; data: Record<string, any> }
  : S extends `xms/${infer V extends number};${infer Rest}`
  ? {
    version: V;
    isFallback: false;
    data: ParseEntries<Split<Rest, ";", 0>, 0>;
  }
  : S extends `xms/${infer V extends number}`
  ? { version: V; isFallback: false; data: {} }
  : {
    version: 0;
    isFallback: true;
    data: ParseEntries<Split<S, ";", 0>, 0>;
  };

export type ExtractRef<T> = T extends { ref: infer R } ? R : Record<string, any>;
export type InferVersion<T> = T extends { version: infer V } ? V : 0;
export type InferIsFallback<T> = T extends { isFallback: infer F } ? F : true;
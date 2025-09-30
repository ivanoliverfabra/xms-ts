/** Utility: force TS to materialize a type instead of infinitely expanding it */
type Simplify<T> = { [K in keyof T]: T[K] } & {};

/** Safe string split with recursion limit */
type Split<
  S extends string,
  Sep extends string,
  Depth extends any[] = []
> = Depth["length"] extends 20 // cap recursion at 20
  ? [S]
  : S extends `${infer A}${Sep}${infer B}`
  ? [A, ...Split<B, Sep, [...Depth, 1]>]
  : [S];

/** Expand dotted keys into nested objects */
type ExpandKey<K extends string, V> = K extends `${infer Head}.${infer Rest}`
  ? { [P in Head]: ExpandKey<Rest, V> }
  : { [P in K]: V };

/** Merge two types recursively */
type Merge<A, B> = {
  [K in keyof A | keyof B]: K extends keyof A
  ? K extends keyof B
  ? Merge<A[K], B[K]>
  : A[K]
  : K extends keyof B
  ? B[K]
  : never;
};

/** Expand shape: turns flat dotted keys into nested types */
export type ExpandShape<T> = Simplify<{
  [K in keyof T as K extends `${infer Head}.${infer Rest}` ? Head : K]: K extends `${infer Head}.${infer Rest}`
  ? ExpandShape<{ [P in Rest]: T[K] }>
  : T[K];
}>;

/** Return `entries` array from a nested object shape */
export type EntriesFromData<T, Prefix extends string = ""> = {
  [K in keyof T & string]: T[K] extends object
  ? EntriesFromData<T[K], `${Prefix}${K}.`>
  : { name: `${Prefix}${K}`; value: T[K] };
}[keyof T & string];

/** Convert `key=value` into nested object type */
type KVPair<S extends string> = S extends `${infer K}=${infer V}`
  ? ExpandKey<K, V>
  : {};

/** Parse an array of key=value strings into a nested object */
type ParseEntries<
  S extends readonly string[],
  Depth extends any[] = []
> = Depth["length"] extends 20
  ? {}
  : S extends [infer First extends string, ...infer Rest extends string[]]
  ? Merge<KVPair<First>, ParseEntries<Rest, [...Depth, 1]>>
  : {};

/** Parse full XMS string at type level */
export type ParseXMS<S extends string> = S extends `xms/${infer V extends number};${infer Rest}`
  ? {
    version: V;
    isFallback: false;
    data: Simplify<ParseEntries<Split<Rest, ";">>>;
  }
  : S extends `xms/${infer V extends number}`
  ? { version: V; isFallback: false; data: {} }
  : {
    version: 0;
    isFallback: true;
    data: Simplify<ParseEntries<Split<S, ";">>>;
  };

/** Helpers */
export type ExtractRef<T> = T extends { ref: infer R }
  ? R
  : Record<string, any>;

export type InferVersion<T> = T extends { version: infer V } ? V : 0;

export type InferIsFallback<T> = T extends { isFallback: infer F }
  ? F
  : true;
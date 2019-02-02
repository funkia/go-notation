import transformer from "./transform";

interface FlatMap<A> {
  flatMap(f: (a: A) => FlatMap<any>): FlatMap<any>;
}

type FlatMapValue<M> = M extends FlatMap<infer A> ? A : never;

function bind<M extends FlatMap<any>>(a: M): FlatMapValue<M> {
  return 0 as any;
}

export function go<A extends FlatMap<any>>(f: (b: typeof bind) => A): A {
  return undefined as any;
}

export default transformer;

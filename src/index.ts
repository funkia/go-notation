import transformer from "./transform";

interface FlatMap<A> {
  flatMap(f: (a: A) => FlatMap<any>): FlatMap<any>;
}

type FlatMapValue<M> = M extends FlatMap<infer A> ? A : never;

function bind<M extends FlatMap<any>>(a: M): FlatMapValue<M> {
  return 0 as any;
}

export function go<A extends FlatMap<any>>(f: (b: typeof bind) => A): A {
  throw new Error(
    "go should never be called at run-time. Ensure that you have configured go-notation correctly."
  );
}

export default transformer;

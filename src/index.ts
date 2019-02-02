interface FlatMap<A> {
  flatMap<B>(f: (a: A) => FlatMap<B>): FlatMap<B>;
}

type FlatMapValue<M> = M extends FlatMap<infer A> ? A : never;

function bind<A, M extends FlatMap<A>>(a: M): FlatMapValue<M> {
  return 0 as any;
}

export function go<A, M extends FlatMap<A>>(f: (b: typeof bind) => M): M {
  return undefined as any;
}

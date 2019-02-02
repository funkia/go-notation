import { go } from "@funkia/go-notation";

class Maybe<A> {
  constructor(private value: A) {}
  flatMap<B>(f: (a: A) => Maybe<B>): Maybe<B> {
    return f(this.value);
  }
}

function simple() {
  return go(bind => {
    const a = bind(new Maybe(12));
    const b = bind(new Maybe(42));
    return new Maybe(a * 2);
  });
}
function simpleRes() {
  return new Maybe(12).flatMap(a => new Maybe(a * 2));
}
simple();
simpleRes();

function test0() {
  return go(bind => {
    const a = bind(new Maybe(12));
    const b = bind(new Maybe("horse"));
    const c1 = bind(new Maybe(2));
    const c2 = bind(new Maybe(12));
    const c = c1 + c2;
    return new Maybe(a.toString() + b + c);
  });
}

function test1() {
  return new Maybe(12).flatMap(a => {
    return new Maybe("horse").flatMap(b => {
      return new Maybe(2).flatMap(temp => {
        return new Maybe(12).flatMap(temp2 => {
          const c = temp + temp2;
          return new Maybe(a.toString() + b + c);
        });
      });
    });
  });
}

// test0();
// test1();

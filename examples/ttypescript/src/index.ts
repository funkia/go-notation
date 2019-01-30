import { go } from "../../../";

class Maybe<A> {
  constructor(private value: A) {}
  flatMap<B>(f: (a: A) => Maybe<B>): Maybe<B> {
    return f(this.value);
  }
}

function test0() {
  return go(bind => {
    const a = bind(new Maybe(12));
    const b = bind(new Maybe("horse"));
    const c = bind(new Maybe(2)) + bind(new Maybe(12));
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

test0();
test1();

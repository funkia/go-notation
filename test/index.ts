import { describe, it } from "mocha";
import * as assert from "assert";

import { go } from "../src/index";

describe("go-notation", () => {
  it("works in simple case with arrow function", () => {
    const array = go(bind => {
      const a = bind([1, 2]);
      const b = bind([3, 4]);
      return [a, b];
    });
    assert.deepEqual(array, [1, 3, 1, 4, 2, 3, 2, 4]);
  });
  it("supports custom bind name", () => {
    const array = go(foobar => {
      const a = foobar([1, 2]);
      const b = foobar([3, 4]);
      return [a, b];
    });
    assert.deepEqual(array, [1, 3, 1, 4, 2, 3, 2, 4]);
  });
  it("handles anonymous functions without arrow", () => {
    const array = go(function(foobar) {
      const a = foobar([1, 2]);
      const b = foobar([3, 4]);
      return [a, b];
    });
    assert.deepEqual(array, [1, 3, 1, 4, 2, 3, 2, 4]);
  });
  it("does not mess with non-bind", () => {
    function foo(a: number) {
      return a;
    }
    const array = go(function(foobar) {
      const a = foobar([1, 2]);
      const b = 3;
      const c = foo(2);
      return [a, b, c];
    });
    assert.deepEqual(array, [1, 3, 2, 2, 3, 2]);
  });
  // it("handles binary expressions", () => {
  //   const array = go(bind => {
  //     const a = bind([1, 2]) + bind([3, 4]);
  //     return [a];
  //   });
  //   assert.deepEqual(array, [4, 5, 5, 6]);
  // });
  // it("handles binary expressions, left", () => {
  //   const array = go(bind => {
  //     const a = bind([1, 2]) + 12;
  //     return [a];
  //   });
  //   assert.deepEqual(array, [13, 14]);
  // });
  // it("handles binary expressions, right", () => {
  //   const array = go(bind => {
  //     const a = 12 + bind([3, 4]);
  //     return [a];
  //   });
  //   assert.deepEqual(array, [15, 16]);
  // });
});

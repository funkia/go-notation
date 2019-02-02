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
});

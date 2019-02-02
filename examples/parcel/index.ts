import { go } from "go-notation";

const numbers = go(bind => {
  const n = bind([1, 2, 3]);
  const m = bind([5, 6, 7]);
  return [n * m];
});

console.log(numbers);

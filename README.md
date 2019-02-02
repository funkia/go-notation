# go-notation

Type-safe do-notation for TypeScript.

Like `async/await` but for anything that has a `flatMap` method.

## Example

go-notation is a TypeScript custom transformation plugin that transforms code like the following.

```typescript
const arrayA = [5, 6, 7, 8, 9];
const arrayB = [2, 3, 4];
const arrayC = go(bind => {
  const a = bind(arrayA);
  const b = bind(arrayB);
  return a % b === 0 ? [a / b] : [];
});
console.log(arrayC); // logs: [ 3, 2, 4, 2, 3 ]
```

Into the following.

```typescript
const arrayA = [5, 6, 7, 8, 9];
const arrayB = [2, 3, 4];
const arrayC = (() =>
  arrayA.flatMap(a =>
    arrayB.flatMap(b => {
      a % b === 0 ? [a / b] : [];
    });
  });
)();
console.log(arrayC);
```

## Why?

Working monads while making repeated usage of `flatMap` quickly gets tedious.
One ends up with hard to read deeply nested code like this.

```ts
monadA.flatMap(a =>
  monadB.flatMap(b =>
    monadC.flatMap(c => (c ? createMonad(a + b) : createMonad(b - a)))
  )
);
```

This problem has been solved in languages like Haskell by introducing a syntax
called _do-notation_ at the language level. In JavaScript the problem has been
solved for the specific monad `Promise` with the `async/await` syntax.
go-notation solves the same problem more generally for anything that has a
`flatMap` method.

With go-notation the above example can be written as:

```typescript
import { go } from "@funkia/go-notation";

go(bind => {
  const a = bind(monadA);
  const b = bind(monadB);
  const c = bind(monadC);
  return c ? createMonad(a + b) : createMonad(b - a);
});
```

go-notation is implemented as a custom transformation plugin for the TypeScript compiler. The above code gets transpiled into code equivalent to the previous example with explicit `flatMap` calls.

## Featurs

- 100% type-safe.
- Works with any type that has a `flatMap` method.
- Compiles to clean, efficient code.
- Doesn't extend JavaScript with new syntax. Therefore it work flawlessly with
  any text editor or IDE.

## Ceveats

As of right now the transformation only supports usages of `bind` of the
following form:

```typescript
const ... = bind (...);
```

We plan to extend the transformation to support occurrences of `bind` in any
expression or subexpression. For instance the following:

```typescript
const a = bind(arrayA) + bind(arrayB);
```

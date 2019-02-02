# go-notation

Type-safe do-notation for TypeScript.

Like `async/await` but for anything that has a `flatMap` method.

## Table of contents

- [What](#what)
- [Why](#why)
- [Features](#features)
- [Installation and setup](#installation-and-setup)
- [Caveats](#caveats)

## What

go-notation is a TypeScript custom transformation plugin that transforms code
like the following.

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

## Why

Working with monads while making repeated usage of `flatMap` quickly gets
tedious. One ends up with hard to read deeply nested code like this.

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

go-notation is implemented as a custom transformation plugin for the TypeScript
compiler. The above code gets transpiled into code equivalent to the previous
example with explicit `flatMap` calls.

## Features

- 100% type-safe.
- Works with any type that has a `flatMap` method.
- Compiles to clean, efficient code.
- Doesn't extend JavaScript with new syntax. Therefore it works flawlessly with
  any text editor or IDE.

## Installation and setup

Install the go-notation from npm.

```
npm i --save-dev @funkia/go-notation
```

While the TypeScript compiler supports custom transformers in its programmatic
API there is no way to configure custom transformers through `tsconfig.json`. We
therefore recommend using [TTypeScript](https://github.com/cevek/ttypescript)
which is a small wrapper around TypeScript that adds support for configuration
of custom transformers in `tsconfig.json`.

First install TTypeScript.

```
npm i --save-dev ttypescript
```

Then add the following to your `tsconfig.json`.

```diff
 {
     "compilerOptions": {
+        "plugins": [
+            { "transform": "@funkia/do-notation" },
+        ]
     }
 }
```

You can now use `ttsc` instead of `tsc` and TTypeScript will apply the
go-notation transformation during the compile step. TTypeScript also supports
ts-node, Parcel, Webpack, and more. See [its
readme](https://github.com/cevek/ttypescript#command-line) for more information.

## Caveats

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

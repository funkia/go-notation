import * as ts from "typescript";

export default function transformer(): ts.TransformerFactory<ts.SourceFile> {
  return (context: ts.TransformationContext) => {
    return (file: ts.SourceFile) => ts.visitEachChild(file, visitor, context);

    function visitor(node: ts.Node): ts.VisitResult<ts.Node> {
      if (ts.isCallExpression(node)) {
        return visitCallExpression(node);
      } else if (ts.isImportDeclaration(node)) {
        return visitImportDeclaration(node);
      } else {
        return ts.visitEachChild(node, visitor, context);
      }
    }

    function visitImportDeclaration(node: ts.ImportDeclaration) {
      return node.moduleSpecifier.getText().slice(1, -1) ===
        "@funkia/go-notation"
        ? undefined
        : node;
    }

    function visitCallExpression(node: ts.CallExpression) {
      if (node.expression.getText() === "go") {
        const arg0 = node.arguments[0];
        if (ts.isFunctionExpression(arg0) || ts.isArrowFunction(arg0)) {
          const bindName = arg0.parameters[0].getText();
          const statements = (arg0.body as ts.FunctionBody).statements;
          return createImmediatelyInvokedFunction(
            ts.createBlock(
              visitGoBody(
                bindName,
                normalizeGoBody(bindName, Array.from(statements))
              )
            )
          );
        }
      }
      return ts.visitEachChild(node, visitor, context);
    }

    function visitGoBody(
      bindName: string,
      statements: ts.Statement[]
    ): ts.Statement[] {
      // return normalizeGoBody(bindName, statements);
      let cur = statements.shift();
      let pre: ts.Statement[] = [];
      while (cur !== undefined) {
        if (ts.isVariableStatement(cur)) {
          const declaration = cur.declarationList.declarations[0];
          const identifier = declaration.name as ts.Identifier;
          const exp = declaration.initializer!;
          const next = visitGoExpression(bindName, identifier, exp, statements);
          if (next !== undefined) {
            return pre.concat(next);
          }
        }
        pre.push(cur);
        cur = statements.shift();
      }
      return pre;
    }

    function visitGoExpression(
      bindName: string,
      identifier: ts.Identifier,
      exp: ts.Expression,
      rest: ts.Statement[]
    ): ts.Statement[] | undefined {
      if (ts.isCallExpression(exp) && exp.expression.getText() === bindName) {
        return [
          ts.createReturn(
            createFlatMapCall(
              exp.arguments[0],
              identifier,
              ts.createBlock(visitGoBody(bindName, rest), true)
            )
          )
        ];
      }
    }
  };
}

function createFlatMapCall(
  exp: ts.Expression,
  argName: ts.Identifier,
  body: ts.Block
) {
  return ts.createCall(ts.createPropertyAccess(exp, "flatMap"), undefined, [
    ts.createArrowFunction(
      undefined,
      undefined,
      [ts.createParameter(undefined, undefined, undefined, argName)],
      undefined,
      undefined,
      body
    )
  ]);
}

function createImmediatelyInvokedFunction(block: ts.Block) {
  return ts.createCall(
    ts.createFunctionExpression(
      undefined,
      undefined,
      undefined,
      undefined,
      [],
      undefined,
      block
    ),
    undefined,
    undefined
  );
}

function normalizeGoBody(bindName: string, statements: ts.Statement[]) {
  return statements.flatMap(s => {
    if (ts.isVariableStatement(s)) {
      const declaration = s.declarationList.declarations[0];
      const identifier = declaration.name as ts.Identifier;
      const init = declaration.initializer!;
      // Special case form `const a = bind(...);`
      if (ts.isCallExpression(init) && init.expression.getText() === bindName) {
        const { pre, exp } = normalizeExpression(bindName, init.arguments[0]);
        const updatedExp = ts.updateCall(init, init.expression, undefined, [
          exp
        ]);
        const updatedStatement = ts.updateVariableStatement(
          s,
          undefined,
          ts.createVariableDeclarationList([
            ts.updateVariableDeclaration(
              s.declarationList.declarations[0],
              identifier,
              undefined,
              updatedExp
            )
          ])
        );
        return pre.concat(updatedStatement);
      } else {
        const { pre, exp } = normalizeExpression(
          bindName,
          declaration.initializer!
        );
        const updatedStatement = ts.updateVariableStatement(
          s,
          undefined,
          ts.createVariableDeclarationList([
            ts.updateVariableDeclaration(
              s.declarationList.declarations[0],
              identifier,
              undefined,
              exp
            )
          ])
        );
        return pre.concat(updatedStatement);
      }
    }
    return [s];
  });
}

function normalizeExpression(
  bindName: string,
  exp: ts.Expression
): { pre: ts.Statement[]; exp: ts.Expression } {
  if (ts.isCallExpression(exp)) {
    const args = exp.arguments.map(a => normalizeExpression(bindName, a));
    const pre = args.flatMap(a => a.pre);
    const updatedExp = ts.updateCall(
      exp,
      exp.expression,
      undefined,
      args.map(a => a.exp)
    );
    const identifier = ts.createUniqueName("bind");
    const dec = ts.createVariableStatement(
      undefined,
      ts.createVariableDeclarationList([
        ts.createVariableDeclaration(identifier, undefined, updatedExp)
      ])
    );
    return {
      pre: pre.concat(dec),
      exp: identifier
    };
  } else if (ts.isBinaryExpression(exp)) {
    const left = normalizeExpression(bindName, exp.left);
    const right = normalizeExpression(bindName, exp.right);
    const updatedExp = ts.updateBinary(exp, left.exp, right.exp);
    return {
      pre: left.pre.concat(right.pre),
      exp: updatedExp
    };
  } else if (ts.isParenthesizedExpression(exp)) {
    const norm = normalizeExpression(bindName, exp.expression);
    const updatedExp = ts.updateParen(exp, norm.exp);
    return {
      pre: norm.pre,
      exp: updatedExp
    };
  }
  return { pre: [], exp };
}

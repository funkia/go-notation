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
            ts.createBlock(visitGoBody(bindName, Array.from(statements)))
          );
        }
      }
      return ts.visitEachChild(node, visitor, context);
    }

    function visitGoBody(
      bindName: string,
      statements: ts.Statement[]
    ): ts.Statement[] {
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
              ts.createBlock(visitGoBody(bindName, rest))
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

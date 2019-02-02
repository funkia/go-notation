import * as ts from "typescript";

export default function transformer(): ts.TransformerFactory<ts.SourceFile> {
  return (context: ts.TransformationContext) => {
    return (file: ts.SourceFile) => ts.visitEachChild(file, visitor, context);

    function visitor(node: ts.Node): ts.VisitResult<ts.Node> {
      switch (node.kind) {
        case ts.SyntaxKind.CallExpression:
          return visitCallExpression(<ts.CallExpression>node);
        case ts.SyntaxKind.ImportDeclaration:
          return visitImportDeclaration(<ts.ImportDeclaration>node);
      }
      return ts.visitEachChild(node, visitor, context);
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
        switch (arg0.kind) {
          case ts.SyntaxKind.FunctionExpression: {
            const bindName = arg0.getChildAt(2).getText();
            const statements = arg0
              .getChildAt(4)
              .getChildAt(1)
              .getChildren() as ts.Statement[];
            return createImmediatelyInvokedFunction(
              ts.createBlock(visitGoBody(bindName, statements))
            );
          }
          case ts.SyntaxKind.ArrowFunction: {
            const bindName = arg0.getChildAt(0).getText();
            const statements = arg0
              .getChildAt(2)
              .getChildAt(1)
              .getChildren() as ts.Statement[];
            return createImmediatelyInvokedFunction(
              ts.createBlock(visitGoBody(bindName, statements))
            );
          }
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
        switch (cur.kind) {
          case ts.SyntaxKind.VariableStatement:
            const line = cur
              .getChildAt(0)
              .getChildAt(1)
              .getChildAt(0);
            const identifier = line.getChildAt(0) as ts.Identifier;
            const exp = visitBindLine(bindName, <ts.Expression>(
              line.getChildAt(2)
            ));
            if (exp !== undefined) {
              pre.push(
                ts.createReturn(
                  createFlatMapCall(
                    exp,
                    identifier,
                    ts.createBlock(visitGoBody(bindName, statements), true)
                  )
                )
              );
              return pre;
            }
          default:
            pre.push(cur);
        }
        cur = statements.shift();
      }
      return pre;
    }

    function visitBindLine(
      bindName: string,
      exp: ts.Expression
    ): ts.Expression | undefined {
      switch (exp.kind) {
        case ts.SyntaxKind.CallExpression:
          if ((<ts.CallExpression>exp).expression.getText() === bindName) {
            return (<ts.CallExpression>exp).arguments[0];
          }
        case ts.SyntaxKind.BinaryExpression:
          const left = visitBindLine(bindName, exp.getChildAt(
            0
          ) as ts.Expression);
          const right = visitBindLine(bindName, exp.getChildAt(
            2
          ) as ts.Expression);
          if (left !== undefined && right !== undefined) {
            const leftId = ts.createUniqueName("bind");
            const rightId = ts.createUniqueName("bind");
            return createFlatMapCall(
              left,
              leftId,
              ts.createBlock([
                ts.createReturn(
                  createFlatMapCall(
                    right,
                    rightId,
                    ts.createBlock([
                      ts.createReturn(
                        ts.updateBinary(
                          <ts.BinaryExpression>exp,
                          leftId,
                          rightId
                        )
                      )
                    ])
                  )
                )
              ])
            );
          }
      }
      return undefined;
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

import * as ts from "typescript";

export default function transformer(): ts.TransformerFactory<ts.SourceFile> {
  return (context: ts.TransformationContext) => {
    return (file: ts.SourceFile) => ts.visitEachChild(file, visitor, context);

    function visitor(node: ts.Node): ts.VisitResult<ts.Node> {
      if (ts.isCallExpression(node) && node.expression.getText() === "go") {
        return visitGoBody(<ts.CallExpression>node);
      }
      return ts.visitEachChild(node, visitor, context);
    }
  };
}

function visitGoBody(node: ts.CallExpression) {
  const arg0 = node.arguments[0];
  if (ts.isArrowFunction(arg0)) {
    const statements = arg0
      .getChildAt(2)
      .getChildren()[1]
      .getChildren() as ts.Statement[];

    return ts.createCall(
      ts.createFunctionExpression(
        undefined,
        undefined,
        undefined,
        undefined,
        [],
        undefined,
        ts.createBlock(visitBinds(statements))
      ),
      undefined,
      undefined
    );
  }
}

function visitBinds(statements: ts.Statement[]): ts.Statement[] {
  const i = statements.findIndex(s => {
    if (ts.isVariableStatement(s)) {
      const body = s
        .getChildren()[0]
        .getChildren()[1]
        .getChildren()[0];
      if (ts.isVariableDeclaration(body)) {
        const exp = body.getChildAt(2);
        if (ts.isCallExpression(exp) && exp.expression.getText() === "bind") {
          return true;
        }
      }
    }
    return false;
  });

  if (i > -1) {
    const left = statements.slice(0, i);
    const right = statements.slice(i + 1);
    const bind = statements[i];
    const line = bind
      .getChildren()[0]
      .getChildren()[1]
      .getChildren()[0];
    const exp: ts.CallExpression = line.getChildAt(2) as any;

    const identifier = line.getChildAt(0) as ts.Identifier;
    const val = exp.arguments[0];
    const body = ts.createArrowFunction(
      undefined,
      undefined,
      [ts.createParameter(undefined, undefined, undefined, identifier)],
      undefined,
      undefined,
      ts.createBlock(visitBinds(right), true)
    );
    body.pos = 196;
    return left.concat([
      ts.createReturn(
        ts.createCall(ts.createPropertyAccess(val, "flatMap"), undefined, [
          body
        ])
      )
    ]);
  } else {
    return statements;
  }
}

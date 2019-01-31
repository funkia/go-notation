import * as ts from "typescript";

// export default function(/*opts?: Opts*/) {
//   function visitor(ctx: ts.TransformationContext, sf: ts.SourceFile) {
//     const visitor: ts.Visitor = (node: ts.Node): ts.VisitResult => {
//       // here we can check each node and potentially return
//       // new nodes if we want to leave the node as is, and
//       // continue searching through child nodes:
//       return ts.visitEachChild(node, visitor, ctx);
//     };
//     return visitor;
//   }
//   return (ctx: ts.TransformationContext): ts.Transformer => {
//     return (sf: ts.SourceFile) => ts.visitNode(sf, visitor(ctx, sf));
//   };
// }

export default function transformer(
  program: ts.Program
): ts.TransformerFactory<ts.SourceFile> {
  return (context: ts.TransformationContext) => (file: ts.SourceFile) =>
    visitNodeAndChildren(file, program, context);
}

function visitNodeAndChildren(
  node: ts.SourceFile,
  program: ts.Program,
  context: ts.TransformationContext
): ts.SourceFile;
function visitNodeAndChildren(
  node: ts.Node,
  program: ts.Program,
  context: ts.TransformationContext
): ts.Node;
function visitNodeAndChildren(
  node: ts.Node,
  program: ts.Program,
  context: ts.TransformationContext
): ts.Node {
  return ts.visitEachChild(
    visitNode(node, program),
    childNode => visitNodeAndChildren(childNode, program, context),
    context
  );
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

function visitNode(node: ts.Node, program: ts.Program): ts.Node {
  if (ts.isCallExpression(node) && node.expression.getText() === "go") {
    const arg0 = node.arguments[0];
    if (ts.isArrowFunction(arg0)) {
      const statements = arg0
        .getChildAt(2)
        .getChildren()[1]
        .getChildren() as ts.Statement[];

      return ts.createCall(
        ts.createArrowFunction(
          undefined,
          undefined,
          [],
          undefined,
          undefined,
          ts.createBlock(visitBinds(statements))
        ),
        undefined,
        undefined
      );
    }
  }
  return node;
}

// export default function(program: ts.Program, pluginOptions: {}) {
//   return (ctx: ts.TransformationContext) => {
//     return (sourceFile: ts.SourceFile) => {
//       function visitor(node: ts.Node): ts.Node {
//         if (ts.isVariableDeclaration(node)) {
//           // console.log(node);
//         }
//         if (
//           ts.isCallExpression(node) &&
//           node.expression.getText(sourceFile) === "go"
//         ) {
//           console.log(node);
//         }
//         return ts.visitEachChild(node, visitor, ctx);
//       }
//       return ts.visitEachChild(sourceFile, visitor, ctx);
//     };
//   };
// }

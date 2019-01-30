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

function visitNode(node: ts.Node, program: ts.Program): ts.Node {
  if (ts.isCallExpression(node) && node.expression.getText() === "go") {
    const arg0 = node.arguments[0];
    if (ts.isArrowFunction(arg0)) {
      const statements = arg0.body
        .getChildAt(1)
        .getChildren() as ts.Statement[];
      for (const s of statements) {
        if (ts.isVariableStatement(s)) {
          const parts = s
            .getChildren()[0]
            .getChildren()[1]
            .getChildren()[0];
          if (ts.isVariableDeclaration(parts)) {
            const exp = parts.getChildAt(2);
            if (
              ts.isCallExpression(exp) &&
              exp.expression.getText() === "bind"
            ) {
              const identifier = ts.createIdentifier(
                parts.getChildAt(0).getText()
              );
              const val = exp.arguments[0];
              // Somehow do `val`.flatMap(`identifier` => rest of statements)
            }
          }
        }
      }
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

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

export default function(program: ts.Program, pluginOptions: {}) {
  return (ctx: ts.TransformationContext) => {
    return (sourceFile: ts.SourceFile) => {
      function visitor(node: ts.Node): ts.Node {
        if (ts.isVariableDeclaration(node)) {
          // console.log(node);
        }
        if (
          ts.isCallExpression(node) &&
          node.expression.getText(sourceFile) === "go"
        ) {
          console.log(node);
        }
        return ts.visitEachChild(node, visitor, ctx);
      }
      return ts.visitEachChild(sourceFile, visitor, ctx);
    };
  };
}

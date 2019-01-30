var goNotation = require("../../dist/transform.js").default;

module.exports = {
  mode: "development",
  entry: "./app.ts",
  output: {
    filename: "bundle.js"
  },
  resolve: {
    extensions: [".ts", ".js"]
  },
  module: {
    rules: [
      {
        test: /\.ts$/,
        loader: "ts-loader",
        options: {
          getCustomTransformers: () => ({
            before: [uppercaseStringLiteralTransformer]
          })
        }
      }
    ]
  }
};

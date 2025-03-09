// const NodePolyfillPlugin = require("node-polyfill-webpack-plugin");
const path = require("node:path");

module.exports = ({ config }) => {
  return {
    ...config,
    resolve: {
      extensions: [...[".mjs"], ...config.resolve.extensions],
      ...config.resolve,
    },
    module: {
      rules: [
        {
          test: /\.css$/i,
          use: [
            {
              loader: "css-loader",
              options: { exportType: "string" } // 🔥 Ritorna direttamente una stringa
            }
          ]
        },
        ...config.module.rules,
      ],
    },
  };
};

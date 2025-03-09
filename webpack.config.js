module.exports = ({ config }) => {
  return {
    ...config,
    module: {
      rules: [
        {
          test: /\.css$/i,
          use: [
            {
              loader: "css-loader",
              options: { exportType: "string" },
            },
          ],
        },
        ...config.module.rules,
      ],
    },
  };
};

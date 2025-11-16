const path = require('path');

module.exports = {
  entry: './src/widget.ts',
  output: {
    filename: 'widget.js',
    path: path.resolve(__dirname, 'dist'),
    library: {
      name: 'EmbedChat',
      type: 'umd',
      export: 'default',
    },
    globalObject: 'this',
  },
  module: {
    rules: [
      {
        test: /\.ts$/,
        use: 'ts-loader',
        exclude: /node_modules/,
      },
      {
        test: /\.css$/,
        use: ['style-loader', 'css-loader'],
      },
    ],
  },
  resolve: {
    extensions: ['.ts', '.js'],
  },
};

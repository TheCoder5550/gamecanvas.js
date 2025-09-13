const path = require('path');

module.exports = {
  mode: "production",
  entry: {
    "latest": './src/gameCanvas-6.0.js',
    "6.0": './src/gameCanvas-6.0.js',
    "5.0": './src/gameCanvas-5.0.js',
    "4.0": './src/gameCanvas-4.0.js',
    "3.0": './src/gameCanvas-3.0.js',
    "2.0": './src/gameCanvas-2.0.js',
    "1.0": './src/gameCanvas-1.0.js',
  },
  output: {
    filename: 'gameCanvas-[name].min.js',
    globalObject: 'this',
    library: {
      name: "GameCanvas",
      type: 'umd',
    },
    libraryExport: 'default',
    path: path.resolve(__dirname, 'dist'),
    clean: true,
  },
};
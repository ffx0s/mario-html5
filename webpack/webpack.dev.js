const merge = require('webpack-merge')
const common = require('./webpack.common')

const dev = {
  mode: 'development',
  devtool: 'inline-source-map',
  devServer: {
    open: true,
    host: '0.0.0.0',
  },
}

module.exports = merge(common, dev)

let webpack = require('webpack');

let path = require('path');

module.exports = {

  entry: {

    app: './resources/assets/js/app.js',

    vendor: ['vue', 'axios']
  },

  output: {

    path: path.resolve(__dirname, 'public/js'),

    filename: '[name].js',

    publicPath: './public'
  },



  module: {

    rules: [
      {
          test: /\.scss$/,
          use: [{
              loader: "style-loader" // creates style nodes from JS strings
          }, {
              loader: "css-loader" // translates CSS into CommonJS
          }, {
              loader: "sass-loader" // compiles Sass to CSS
          }]
      },
      {
          test: /\.css$/,
          loader: 'style-loader!css-loader'
      },
      {
        test: /\.js$/,

        exclude: /node_modules/,

        loader: 'babel-loader'
      },
      {
        test: /\.vue$/,

        loader: 'vue-loader',

        options: {  /* vue-loader options go here */ }
      },
      {
        test: /\.scss$/,
        loaders: ["style", "css?modules&importLoaders=2", "sass", "bulma?theme=sass/bulma.sass"]
      }
    ]
  },


  resolve: {
    alias: {
      'vue$': 'vue/dist/vue.esm.js' // 'vue/dist/vue.common.js' for webpack 1
    }
  },


  plugins: [
    new webpack.optimize.CommonsChunkPlugin({
      names: ['vendor']
    })
  ]

};

if(process.env.NODE_ENV === 'production') {

  module.exports.plugins.push(
    new webpack.optimize.UglifyJsPlugin({
      sourcemap: true,
      compress: {
        warnings: false,
      }
    })
  );

  module.exports.plugins.push(
      new webpack.DefinePlugin({
          'process.env': {
              NODE_ENV: '"production"'
          }
      })
  );


}

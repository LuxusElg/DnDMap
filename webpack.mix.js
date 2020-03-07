const cssImport = require('postcss-import');
const cssNesting = require('postcss-nesting');
const mix = require('laravel-mix');
const path = require('path');
const purgecss = require('@fullhuman/postcss-purgecss');
const tailwindcss = require('tailwindcss');

mix
.react('resources/js/app.js', 'public/js')
.postCss('resources/css/app.css', 'public/css/app.css')
.options({
  postCss: [
	cssImport(),
	cssNesting(),
	tailwindcss('tailwind.config.js'),
	...(mix.inProduction()
	  ? [
		  purgecss({
			content: [
			  './resources/views/**/*.blade.php',
			  './resources/js/**/*.js'
			],
			defaultExtractor: content =>
			  content.match(/[\w-/:.]+(?<!:)/g) || [],
			whitelistPatternsChildren: [/nprogress/]
		  })
		]
	  : [])
  ]
})
.webpackConfig({
  output: { chunkFilename: 'js/[name].js?id=[chunkhash]' },
  resolve: {
	alias: {
	  '@': path.resolve('resources/js')
	}
  }
})
.version()
.sourceMaps();

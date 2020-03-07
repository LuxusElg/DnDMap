module.exports = {
	theme: {
	  extend: {
		boxShadow: theme => ({
		  outline: '0 0 0 2px ' + theme('colors.gray.900')
		}),
	  }
	},
	variants: {
	  backgroundColor: ['responsive', 'hover', 'focus', 'group-hover', 'focus-within'],
	  textColor: ['responsive', 'hover', 'focus', 'group-hover', 'focus-within'],
	  zIndex: ['responsive', 'focus']
	},
	plugins: []
  }
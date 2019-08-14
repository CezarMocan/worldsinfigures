/* eslint-disable */
const withLess = require('@zeit/next-less')

// fix: prevents error when .less files are required by node
if (typeof require !== 'undefined') {
  require.extensions['.less'] = (file) => {}
}

module.exports = withLess({
  lessLoaderOptions: {
    javascriptEnabled: true,
  },
  generateBuildId: async () => {
    // For example get the latest git commit hash here
    return 'constant-build-id'
  },
})
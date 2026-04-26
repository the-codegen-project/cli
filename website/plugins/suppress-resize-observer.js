/**
 * Docusaurus plugin to suppress ResizeObserver errors in webpack-dev-server overlay.
 */
module.exports = function () {
  return {
    name: 'suppress-resize-observer',
    configureWebpack() {
      return {
        devServer: {
          client: {
            overlay: {
              runtimeErrors: (error) => {
                // Suppress ResizeObserver loop errors (benign Monaco Editor issue)
                if (error?.message === 'ResizeObserver loop completed with undelivered notifications.') {
                  return false;
                }
                return true;
              },
            },
          },
        },
      };
    },
  };
};

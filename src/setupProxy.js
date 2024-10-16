// src/setupProxy.js

const { createProxyMiddleware } = require('http-proxy-middleware');

module.exports = function(app) {
  app.use(
    '/myapp',
    createProxyMiddleware({
      target: 'http://localhost:5300', // Your Spring Boot server URL
      changeOrigin: true,
      pathRewrite: {
        '^/myapp': '', // Rewrite path if necessary
      },
    })
  );
};

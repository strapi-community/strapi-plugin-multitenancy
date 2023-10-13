'use strict';

module.exports = ({ strapi }) => ({
  index(ctx) {
    ctx.body = strapi
      .plugin('multitenancy')
      .service('myService')
      .getWelcomeMessage();
  },
});

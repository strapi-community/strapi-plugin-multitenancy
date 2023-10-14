"use strict";

module.exports = async ({ strapi }) => {
  const actions = [
    {
      section: "plugins",
      displayName: "Read",
      uid: "read",
      pluginName: "multitenancy",
    },
  ];

  await strapi.admin.services.permission.actionProvider.registerMany(actions);

  strapi.entityService.decorate((defaultService) => ({
    delete: async (uid, id, opts) => {},

    deleteMany: async (uid, opts) => {},

    findOne: async (uid, id, opts) => {},
    wrapParams: async (opts, ctx) => {
      const wrappedParams = await defaultService.wrapParams(opts, ctx);
      const fullCTX = strapi.requestContext.get();
      //console.log(fullCTX);
      let customFilter = {};
      if ((fullCTX.state.auth.name = "admin")) {
        //transformParamsToQuery
        customFilter = {
          tenant_id: fullCTX.state.user.tenant_id,
        };
      }
      console.log(fullCTX.state.user);
      if (wrappedParams.data) {
        delete wrappedParams.data.tenant_id;
      }
      return {
        ...wrappedParams,
        filters: {
          $and: [wrappedParams.filters, customFilter],
        },
      };
    },
  }));
};

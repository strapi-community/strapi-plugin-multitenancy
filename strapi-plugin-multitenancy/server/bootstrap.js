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
    findOne: async (uid, id, opts) => {
      const fullCTX = strapi.requestContext.get();
      const result = await strapi.db.query(uid).findMany({
        where: { id: id, tenant_id: fullCTX.state.user.tenant_id },
        select: [],
      });
      if (result.length === 0) {
        return;
      }
      return defaultService.findOne(uid, id, opts);
    },
    wrapParams: async (opts, ctx) => {
      const wrappedParams = await defaultService.wrapParams(opts, ctx);
      if (wrappedParams.filters === undefined) {
        wrappedParams.filters = {};
      }
      const fullCTX = strapi.requestContext.get();
      let customFilter = {};
      if (
        fullCTX.state?.auth?.strategy?.name === "admin" ||
        fullCTX.state?.auth?.strategy?.name === "users-permissions"
      ) {
        customFilter = {
          tenant_id: fullCTX.state?.user?.tenant_id,
        };
      }
      if (wrappedParams.data && fullCTX.state?.user?.tenant_id) {
        wrappedParams.data.tenant_id = fullCTX.state.user.tenant_id;
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

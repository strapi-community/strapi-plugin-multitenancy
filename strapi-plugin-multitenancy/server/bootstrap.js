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
      console.log(fullCTX.state.auth.credentials);
      let customFilter;
      console.log(fullCTX.state?.auth?.strategy);
      if (
        fullCTX.state?.auth?.strategy === "api-token" &&
        fullCTX.state?.auth?.credentials?.tenant_id === undefined
      ) {
        const token = await strapi.query("admin::api-token").findOne({
          select: ["tenant_id"],
          where: { id: ullCTX.state.auth.credentials.id },
        });
        fullCTX.state.auth.credentials.tenant_id = token.tenant_id;
      }
      if (fullCTX.state?.auth?.credentials?.tenant_id !== undefined) {
        customFilter = {
          tenant_id: fullCTX.state.auth.credentials.tenant_id,
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

"use strict";

const { sanitize } = require("@strapi/utils");
const { contentAPI } = sanitize;

module.exports = ({ strapi }) => ({
  async find(ctx) {
    const contentType = strapi.contentType("plugin::cluster-master.server");

    const entities = await strapi.entityService.findMany(contentType.uid);

    return await contentAPI.output(entities, contentType, ctx.state.auth);
  },

  async change(ctx) {
    if (ctx.request.body.tenant === undefined) return;
    await strapi
      .service("plugin::multitenancy.selectTenant")
      .set(ctx.state.user, ctx.request.body.tenant);
    ctx.response.status = 200;
  },
  async current(ctx) {
    const tenant = strapi
      .service("plugin::multitenancy.selectTenant")
      .get(ctx.state.user);

    return { tenant: tenant };
  },
  async me(ctx) {
    const contentType = strapi.contentType("plugin::multitenancy.tenant");
    const entities = await strapi.db.query(contentType.uid).findMany({
      fields: ["name"],
      where: {
        admin_users: { id: ctx.state.user.id },
      },
    });
    const output = await contentAPI.output(
      entities,
      contentType,
      ctx.state.auth
    );
    if (ctx.state.user.roles.findIndex((role) => role.id === 1) !== -1) {
      output.push({ name: "main" });
    }

    return output;
  },
});

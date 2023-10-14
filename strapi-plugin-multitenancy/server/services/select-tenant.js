"use strict";

const { ThemeConsumer } = require("styled-components");

module.exports = ({ strapi }) => ({
  get(user) {
    if (user.tenant_id === null) {
      return "main";
    }
    return user.tenant_id;
  },

  async set(user, tenant) {
    if (tenant === "main") {
      tenant = null;
    }
    const entry = await strapi.db.query("admin::user").update({
      where: { id: user.id },
      data: {
        tenant_id: tenant,
      },
    });
  },
});

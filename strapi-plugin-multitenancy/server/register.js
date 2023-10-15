"use strict";

function injectMiddleware(route, pluginUUid) {
  if (typeof route.config === "undefined") {
    route.config = {};
  }
  if (typeof route.config.middlewares === "undefined") {
    route.config.middlewares = [pluginUUid];
  } else {
    route.config.middlewares.push(pluginUUid);
  }
}

module.exports = ({ strapi }) => {
  for (const indexedCT of Object.values(strapi.contentTypes)) {
    strapi.contentTypes[indexedCT.uid].attributes["tenant_id"] = {
      type: "string",
      configurable: false,
      writable: false,
      visible: false,
    };
    strapi.contentTypes[indexedCT.uid].__schema__.attributes["tenant_id"] = {
      type: "string",
    };
  }
  const indexPostApiToken = strapi.admin.routes.admin.routes.findIndex(
    (route) =>
      // You can modify this to search for a specific route or multiple
      route.method === "POST" &&
      //below replace removes the + at the end of the line
      route.path === "/api-tokens"
  );
  if (indexPostApiToken > -1) {
    injectMiddleware(
      strapi.admin.routes.admin.routes[indexPostApiToken],
      "plugin::multitenancy.injectTenantId"
    );
  }

  const SELECT_FIELDS = [
    "id",
    "name",
    "description",
    "lastUsedAt",
    "type",
    "lifespan",
    "expiresAt",
    "createdAt",
    "updatedAt",
  ];

  /** @constant {Array<string>} */
  const POPULATE_FIELDS = ["permissions"];

  const flattenTokenPermissions = (token) => {
    if (!token) return token;
    return {
      ...token,
      permissions: Array.isArray(token.permissions)
        ? token.permissions.map((permission) => permission.action)
        : token.permissions,
    };
  };
  strapi.admin.services["api-token"].list = async () => {
    const ctx = strapi.requestContext.get();
    const tokens = await strapi.query("admin::api-token").findMany({
      select: SELECT_FIELDS,
      populate: POPULATE_FIELDS,
      orderBy: { name: "ASC" },
      where: { tenant_id: ctx.state.auth.credentials.tenant_id },
    });

    if (!tokens) return tokens;
    return tokens.map((token) => flattenTokenPermissions(token));
  };
};

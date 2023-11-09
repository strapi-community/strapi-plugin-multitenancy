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
function injectPolicy(route, pluginUUid) {
  if (typeof route.config === "undefined") {
    route.config = {};
  }
  if (typeof route.config.middlewares === "undefined") {
    route.config.policies = [pluginUUid];
  } else {
    route.config.policies.push(pluginUUid);
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

  const indexMe = strapi.admin.routes.admin.routes.findIndex(
    (route) =>
      // You can modify this to search for a specific route or multiple
      route.method === "GET" &&
      //below replace removes the + at the end of the line
      route.path === "/users/me"
  );
  if (indexMe !== -1) {
    strapi.admin.routes.admin.routes[indexMe].config.bypassTenant = true;
  }
  const indexMePerm = strapi.admin.routes.admin.routes.findIndex(
    (route) =>
      // You can modify this to search for a specific route or multiple
      route.method === "GET" &&
      //below replace removes the + at the end of the line
      route.path === "/users/me/permissions"
  );
  if (indexMePerm !== -1) {
    strapi.admin.routes.admin.routes[indexMePerm].config.bypassTenant = true;
  }
  const indexInfo = strapi.admin.routes.admin.routes.findIndex(
    (route) =>
      // You can modify this to search for a specific route or multiple
      route.method === "GET" &&
      //below replace removes the + at the end of the line
      route.path === "/information"
  );
  if (indexInfo !== -1) {
    strapi.admin.routes.admin.routes[indexInfo].config.bypassTenant = true;
  }

  const indexInit = strapi.admin.routes.admin.routes.findIndex(
    (route) =>
      // You can modify this to search for a specific route or multiple
      route.method === "GET" &&
      //below replace removes the + at the end of the line
      route.path === "/init"
  );
  if (indexInit !== -1) {
    strapi.admin.routes.admin.routes[indexInit].config.bypassTenant = true;
  }

  const indexLocales = strapi.admin.routes.admin.routes.findIndex(
    (route) =>
      // You can modify this to search for a specific route or multiple
      route.method === "GET" &&
      //below replace removes the + at the end of the line
      route.path === "/i18n/locales"
  );
  if (indexLocales !== -1) {
    strapi.admin.routes.admin.routes[indexLocales].config.bypassTenant = true;
  }
  /*const methods = ["DELETE", "GET", "PUT"];
  for (const method of methods) {
    const indexMethodApiToken = strapi.admin.routes.admin.routes.findIndex(
      (route) =>
        // You can modify this to search for a specific route or multiple
        route.method === method &&
        //below replace removes the + at the end of the line
        route.path === "/admin/login"
    );
    if (indexMethodApiToken > -1) {
      injectPolicy(
        strapi.admin.routes.admin.routes[indexMethodApiToken],
        "plugin::multitenancy.isSameTenant"
      );
    }
  }
  const indexPostApiTokenRegenerate =
    strapi.admin.routes.admin.routes.findIndex(
      (route) =>
        // You can modify this to search for a specific route or multiple
        route.method === "POST" &&
        //below replace removes the + at the end of the line
        route.path === "/api-tokens/:id/regenerate"
    );
  if (indexPostApiTokenRegenerate > -1) {
    injectPolicy(
      strapi.admin.routes.admin.routes[indexPostApiTokenRegenerate],
      "plugin::multitenancy.isSameTenant"
    );
  }

  const indexPostApiToken = strapi.admin.routes.admin.routes.findIndex(
    (route) =>
      // You can modify this to search for a specific route or multiple
      route.method === "POST" &&
      //below replace removes the + at the end of the line
      route.path === "/api-tokens"
  );
  if (indexPostApiToken > -1) {
    injectPolicy(
      strapi.admin.routes.admin.routes[indexPostApiToken],
      "plugin::multitenancy.isSameTenant"
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
  };*/
};

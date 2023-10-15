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
  const indexGetApiToken = strapi.admin.routes.admin.routes.findIndex(
    (route) =>
      // You can modify this to search for a specific route or multiple
      route.method === "GET" &&
      //below replace removes the + at the end of the line
      route.path === "/api-tokens"
  );
  if (indexGetApiToken > -1) {
    injectMiddleware(
      strapi.admin.routes.admin.routes[indexGetApiToken],
      "plugin::multitenancy.redoListApiToken"
    );
  }
};

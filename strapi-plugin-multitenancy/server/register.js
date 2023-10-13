"use strict";

module.exports = ({ strapi }) => {
  strapi.customFields.register({
    name: "tenant_id",
    plugin: "multitenancy",
    inputSize: { default: 4, isResizable: true },
    type: "string",
  });
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
};

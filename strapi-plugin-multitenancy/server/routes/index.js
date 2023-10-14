module.exports = [
  {
    method: "GET",
    path: "/tenants/me",
    handler: "tenant.me",
    config: {
      policies: [
        {
          name: "admin::hasPermissions",
          config: { actions: ["plugin::multitenancy.read"] },
        },
      ],
    },
  },
  {
    method: "GET",
    path: "/tenants",
    handler: "tenant.find",
    config: {
      policies: [
        {
          name: "admin::hasPermissions",
          config: { actions: ["plugin::multitenancy.read"] },
        },
      ],
    },
  },
  {
    method: "POST",
    path: "/current-tenant",
    handler: "tenant.change",
    config: {
      policies: [
        {
          name: "admin::hasPermissions",
          config: { actions: ["plugin::multitenancy.read"] },
        },
      ],
    },
  },
  {
    method: "GET",
    path: "/current-tenant",
    handler: "tenant.current",
    config: {
      policies: [
        {
          name: "admin::hasPermissions",
          config: { actions: ["plugin::multitenancy.read"] },
        },
      ],
    },
  },
];

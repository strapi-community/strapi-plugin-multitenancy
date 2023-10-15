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
const list = async (strapi, ctx) => {
  const tokens = await strapi.query("admin::api-token").findMany({
    select: SELECT_FIELDS,
    populate: POPULATE_FIELDS,
    orderBy: { name: "ASC" },
    where: { tenant_id: ctx.state.auth.credentials.tenant_id },
  });

  if (!tokens) return tokens;
  return tokens.map((token) => flattenTokenPermissions(token));
};

module.exports = (config, { strapi }) => {
  return async (ctx, next) => {
    await next();
    if (ctx.response.body.data !== undefined) {
      const data = await list(strapi, ctx);
      ctx.send({ data });
    }
  };
};

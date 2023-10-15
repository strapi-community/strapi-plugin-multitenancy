module.exports = async (policyContext, config, { strapi }) => {
  if (policyContext.state.user) {
    const result = await strapi.query("admin::api-token").findMany({
      select: [],
      where: {
        tenant_id: ctx.state.auth.credentials.tenant_id,
        id: ctx.request.params.id,
      },
    });
    if (result.length !== 0) {
      return true;
    }
  }

  return false;
};

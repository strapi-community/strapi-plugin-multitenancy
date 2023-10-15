module.exports = (config, { strapi }) => {
  return async (ctx, next) => {
    await next();
    console.log(ctx.response.body?.data?.id);
    if (ctx.response.body?.data?.id !== undefined) {
      strapi.query("admin::api-token").update({
        where: { id: ctx.response.body.data.id },
        data: {
          tenant_id: ctx.state.auth.credentials.tenant_id,
        },
      });
    }
  };
};

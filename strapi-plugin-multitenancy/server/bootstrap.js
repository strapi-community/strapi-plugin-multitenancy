"use strict";

const { ThemeConsumer } = require("styled-components");

module.exports = async ({ strapi }) => {
  async function removeNoneTenantIds(tenant_id, data, target) {
    const newData = [];
    if (data === undefined) {
      return;
    }
    if (typeof data === "number") {
      const record = await strapi.db.entityManager
        .getRepository(target)
        .findOne({
          where: { id: data },
          select: ["tenant_id"],
        });
      if (record.tenant_id === tenant_id) {
        return data;
      }
    }
    for (const relation of data) {
      if (typeof relation === "number") {
        const record = await strapi.db.entityManager
          .getRepository(target)
          .findOne({
            where: { id: relation },
            select: ["tenant_id"],
          });
        if (record.tenant_id === tenant_id) {
          newData.push(relation);
        }
      } else if (typeof relation === "object") {
        const record = await strapi.db.entityManager
          .getRepository(target)
          .findOne({
            where: { id: relation.id },
            select: ["tenant_id"],
          });
        if (record.tenant_id === tenant_id) {
          newData.push(relation);
        }
      }
    }
    return newData;
  }
  async function protectRelations(tenant_id, data, target) {
    if (typeof data === "number") {
      return await removeNoneTenantIds(tenant_id, data, target);
    }
    if (Array.isArray(data) === true) {
      return await removeNoneTenantIds(tenant_id, data, target);
    }
    const newData = {};
    if (data?.connect !== undefined) {
      newData.connect = await removeNoneTenantIds(
        tenant_id,
        data.connect,
        target
      );
    }
    if (data?.set !== undefined) {
      newData.set = await removeNoneTenantIds(tenant_id, data.set, target);
    }
    return newData;
  }
  async function checkComponents(tenant_id, data, componentId, components) {
    const component = components[componentId];
    for (const [key, value] of Object.entries(data)) {
      if (component.attributes[key] === undefined) {
        continue;
      }
      if (component.attributes[key].type === "component") {
        await checkComponents(
          tenant_id,
          value,
          component.attributes[key].component,
          components
        );
      }
      if (component.attributes[key].type === "dynamiczone") {
        for (const component of value) {
          await checkComponents(
            tenant_id,
            component,
            componentData.__component,
            components
          );
        }
      }
      if (component.attributes[key].type === "relation") {
        data[key] = await protectRelations(
          tenant_id,
          value,
          component.attributes[key].target
        );
      }
    }
  }

  async function removeDataForWrongTenant(uid, tenant_id, data) {
    const contentTypes = strapi.container.get("content-types").getAll();
    const components = strapi.components;
    const contentType = contentTypes[uid];
    const fullCTX = strapi.requestContext.get();
    if (contentType === undefined) return;
    if (
      data === undefined ||
      uid === "strapi::core-store" ||
      fullCTX?.state?.route?.config.bypassTenant === true ||
      (fullCTX?.state?.route?.method === "POST" &&
        fullCTX?.state?.route?.path === "/login") ||
      fullCTX?.state?.user === undefined
    ) {
      return;
    }
    for (const [key, value] of Object.entries(data)) {
      if (contentType.attributes[key] === undefined) {
        continue;
      }
      if (contentType.attributes[key].type === "component") {
        await checkComponents(
          tenant_id,
          value,
          contentType.attributes[key].component,
          components
        );
      }
      if (contentType.attributes[key].type === "dynamiczone") {
        for (const componentData of value) {
          await checkComponents(
            tenant_id,
            componentData,
            componentData.__component,
            components
          );
        }
      }
      if (contentType.attributes[key].type === "relation") {
        data[key] = await protectRelations(
          tenant_id,
          value,
          contentType.attributes[key].target
        );
      }
    }
  }

  async function getTenant() {
    const fullCTX = strapi.requestContext.get();
    if (
      fullCTX?.state?.auth?.strategy === "api-token" &&
      fullCTX?.state?.auth?.credentials?.tenant_id === undefined
    ) {
      const token = await strapi.query("admin::api-token").findOne({
        select: ["tenant_id"],
        where: { id: fullCTX.state.auth.credentials.id },
      });
      fullCTX.state.auth.credentials.tenant_id = token.tenant_id;
      return token.tenant_id;
    }
    if (fullCTX?.state?.auth?.credentials?.tenant_id == undefined) {
      return null;
    }
    return fullCTX?.state?.auth?.credentials?.tenant_id;
  }
  async function wrapParams(params = {}, ctx) {
    const fullCTX = strapi.requestContext.get();
    //console.log(ctx);
    //console.log(params);
    //console.log(fullCTX?.state?.route);
    if (
      ctx.uid === "strapi::core-store" ||
      ctx.uid === "admin::permission" ||
      fullCTX?.state?.route?.config.bypassTenant === true ||
      (fullCTX?.state?.route?.method === "POST" &&
        fullCTX?.state?.route?.path === "/login") ||
      fullCTX?.state?.user === undefined
    ) {
      return params;
    }
    if (params.where === undefined) {
      params.where = {};
    }

    let customFilter = {};
    const tenantId = await getTenant();
    if (tenantId === undefined || tenantId === null) {
      customFilter = {
        tenant_id: { $null: true },
      };
    } else {
      customFilter = {
        tenant_id: tenantId,
      };
    }
    if (params.data && tenantId) {
      params.data.tenant_id = tenantId;
    }
    return {
      ...params,
      where: {
        $and: [params.where, customFilter],
      },
    };
  }
  let saver = {};
  strapi.db.query = function (uid) {
    if (saver[uid] !== undefined) {
      return saver[uid];
    }
    const result = strapi.db.entityManager.getRepository(uid);
    saver[uid] = result;
    const findMany = result.findMany;
    result.findMany = async function (params) {
      const wrappedParams = await wrapParams(params, {
        uid,
        action: "findMany",
      });
      return findMany(wrappedParams);
    };

    const findOne = result.findOne;
    result.findOne = async function (params) {
      const fullCTX = strapi.requestContext.get();
      const wrappedParams = await wrapParams(params, {
        uid,
        action: "findOne",
      });
      if (
        uid === "strapi::core-store" ||
        fullCTX?.state?.route?.config.bypassTenant === true ||
        (fullCTX?.state?.route?.method === "POST" &&
          fullCTX?.state?.route?.path === "/login") ||
        fullCTX?.state?.user === undefined
      ) {
        return await findOne(wrappedParams);
      }
      const tenantId = await getTenant();
      let condition = {};
      if (tenantId !== undefined) {
        condition = {
          tenant_id: tenantId,
        };
      }
      const result = await findMany({
        where: { $and: [wrappedParams.where, condition] },
        select: [],
      });
      if (result.length === 0) {
        return;
      }
      return findOne(wrappedParams);
    };

    result.findWithCount = async function (params) {
      const wrappedParams = await wrapParams(params, {
        uid,
        action: "findWithCount",
      });

      return findWithCount(wrappedParams);
    };

    const findPage = result.findPage;
    result.findPage = async function (params) {
      const wrappedParams = await wrapParams(params, {
        uid,
        action: "findPage",
      });

      return findPage(wrappedParams);
    };

    const create = result.create;
    result.create = async function (params) {
      const wrappedParams = await wrapParams(params, { uid, action: "create" });
      await removeDataForWrongTenant(uid, await getTenant(), params?.data);

      return create(wrappedParams);
    };

    const createMany = result.createMany;
    result.createMany = async function (params) {
      const wrappedParams = await wrapParams(params, {
        uid,
        action: "createMany",
      });
      if (Array.isArray(wrappedParams?.data) === true) {
        const tenantId = await getTenant();
        for (const data of wrappedParams.data) {
          await removeDataForWrongTenant(uid, tenantId, data);
        }
      }

      return createMany(wrappedParams);
    };

    const update = result.update;
    result.update = async function (params) {
      const wrappedParams = await wrapParams(params, { uid, action: "update" });
      await removeDataForWrongTenant(
        uid,
        await getTenant(),
        wrappedParams.data
      );

      return update(wrappedParams);
    };

    const updateMany = result.updateMany;
    result.updateMany = async function (params) {
      const wrappedParams = await wrapParams(params, {
        uid,
        action: "updateMany",
      });
      if (Array.isArray(params?.data) === true) {
        const tenantId = await getTenant();
        for (const data of wrappedParams.data) {
          await removeDataForWrongTenant(uid, tenantId, data);
        }
      }

      return updateMany(wrappedParams);
    };
    const clone = result.clone;
    result.clone = async function (id, params) {
      const wrappedParams = await wrapParams(params, { uid, action: "clone" });

      return clone(id, wrappedParams);
    };

    const del = result.delete;
    result.delete = async function (params) {
      const wrappedParams = await wrapParams(params, { uid, action: "delete" });
      return del(wrappedParams);
    };

    const deleteMany = result.deleteMany;
    result.deleteMany = async function (params) {
      const wrappedParams = await wrapParams(params, {
        uid,
        action: "deleteMany",
      });

      return deleteMany(wrappedParams);
    };

    const count = result.count;
    result.count = async function (params) {
      const wrappedParams = await wrapParams(params, { uid, action: "count" });

      return count(wrappedParams);
    };
    return result;
  };

  const actions = [
    {
      section: "plugins",
      displayName: "Read",
      uid: "read",
      pluginName: "multitenancy",
    },
  ];

  await strapi.admin.services.permission.actionProvider.registerMany(actions);
};

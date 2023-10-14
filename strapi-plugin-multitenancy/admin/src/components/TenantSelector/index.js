/**
 *
 * PluginIcon
 *
 */

import React, { useState, useEffect } from "react";
import { SingleSelectOption, SingleSelect } from "@strapi/design-system";
import { useFetchClient } from "@strapi/helper-plugin";
const TenantSelector = () => {
  const { get, post } = useFetchClient();
  const [value, setValue] = useState();
  const [tenants, setTenants] = useState([]);

  useEffect(async () => {
    const myTenants = await get("/multitenancy/tenants/me");
    setTenants(myTenants.data);
    const currentServer = await get("/multitenancy/current-tenant");
    setValue(currentServer.data.tenant);
  }, []);
  const onChange = (value) => {
    setValue(value);
    post("/multitenancy/current-tenant", { tenant: value });
    window.location.reload(false);
  };
  return (
    <SingleSelect onClear={() => {}} value={value} onChange={onChange}>
      {tenants.map((info) => (
        <SingleSelectOption value={info.name}>{info.name}</SingleSelectOption>
      ))}
    </SingleSelect>
  );
};

export default TenantSelector;

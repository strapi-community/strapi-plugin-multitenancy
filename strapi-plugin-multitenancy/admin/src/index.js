import { prefixPluginTranslations } from "@strapi/helper-plugin";
import TenantSelector from "./components/TenantSelector";
import permissions from "./permissions";
import pluginPkg from "../../package.json";
import pluginId from "./pluginId";
import Initializer from "./components/Initializer";

const name = pluginPkg.strapi.name;

export default {
  register(app) {
    app.registerPlugin({
      id: pluginId,
      initializer: Initializer,
      isReady: false,
      name,
    });

    //TODO Figure out how to chance this depending on config value.
    //console.log(app);

    app.addMenuLink({
      to: `/plugins/${pluginId}/empty`,
      icon: TenantSelector,
      intlLabel: {
        id: `${pluginId}.plugin.empty`,
        defaultMessage: " ",
      },
      Component: async () => {
        const component = await import(
          /* webpackChunkName: "my-plugin" */ "./pages/App"
        );

        return component;
      },
      permissions: permissions.main,
    });
  },

  bootstrap(app) {},
  async registerTrads({ locales }) {
    const importedTrads = await Promise.all(
      locales.map((locale) => {
        return import(
          /* webpackChunkName: "translation-[request]" */ `./translations/${locale}.json`
        )
          .then(({ default: data }) => {
            return {
              data: prefixPluginTranslations(data, pluginId),
              locale,
            };
          })
          .catch(() => {
            return {
              data: {},
              locale,
            };
          });
      })
    );

    return Promise.resolve(importedTrads);
  },
};

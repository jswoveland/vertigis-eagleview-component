/* eslint-disable @typescript-eslint/no-unsafe-argument */
/* eslint-disable spaced-comment */
import type { LibraryRegistry } from "@vertigis/web/config";

// EagleView Imports
import EagleView, { EagleViewModel } from "./components/EagleViewEmbeddedExplorer"; 
import {
    applyEVSettings,
    getEVSettings,
    getPictSettingsSchema,
} from "./components/EagleViewEmbeddedExplorer/designer";
import invLanguage from "../src/locale/inv.json";

const LAYOUT_NAMESPACE = "custom.c439ef1a";

export default function (registry: LibraryRegistry): void {
    //Pictometry EagleView
    registry.registerComponent({
        category: "map",
        name: "eagleview",
        namespace: LAYOUT_NAMESPACE,
        getComponentType: () => EagleView,
        getDesignerSettings: (args) => getEVSettings(args),
        applyDesignerSettings: (args) => applyEVSettings(args),
        getDesignerSettingsSchema: (args) => getPictSettingsSchema(args),
        itemType: "eagleview",
        title: "language-designer-eagleview-title",
        iconId: "map-3rd-party",
    });
    registry.registerModel({
        getModel: (config) => new EagleViewModel(config),
        itemType: "eagleview",
    });
    registry.registerLanguageResources({
        locale: "inv",
        values: invLanguage as { [key: string]: string },
    });
}

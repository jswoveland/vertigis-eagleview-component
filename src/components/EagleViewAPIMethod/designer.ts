import {
    applyComponentModelDesignerSettings,
    ApplyDesignerSettingsCallback,
    ComponentModelDesignerSettings,
    DesignerSettings,
    getComponentModelDesignerSettings,
    getComponentModelDesignerSettingsSchema,
    GetDesignerSettingsCallback,
    GetDesignerSettingsSchemaCallback,
    Setting,
    SettingsSchema,
} from "@vertigis/web/designer";

import EagleViewModel from "./EagleViewModel";

export interface EagleViewSettings extends ComponentModelDesignerSettings {
    apiKey: string;
}

export type SettingsMap = DesignerSettings<EagleViewSettings>;

export const applyEVSettings:
    ApplyDesignerSettingsCallback<EagleViewModel,SettingsMap>
    = async (args) => {
    const { model, settings } = args;
    await applyComponentModelDesignerSettings(args);
    model.assignProperties(settings);
};

export const getEVSettings:
    GetDesignerSettingsCallback<EagleViewModel,SettingsMap>
    = async (args) => {
    const { model } = args;
    const { apiKey} = model;
    return {
        ...(await getComponentModelDesignerSettings(args)),
        apiKey
    };
};

export const getPictSettingsSchema:
    GetDesignerSettingsSchemaCallback<EagleViewModel,SettingsMap>
    = async (args) => {
    const baseSchema = await getComponentModelDesignerSettingsSchema(args);
    (baseSchema.settings[0]
        .settings as Setting<EagleViewSettings>[]) = (baseSchema.settings[0]
        .settings as Setting<EagleViewSettings>[]).concat([
        {
            id: "apiKey",
            type: "text",
            description: "language-designer-eagleview-api-key-description",
            displayName: "language-designer-eagleview-api-key-title",
        }
    ]);
    const schema: SettingsSchema<EagleViewSettings> = {
        ...baseSchema,
        settings: [...baseSchema.settings],
    };
    return schema;
};
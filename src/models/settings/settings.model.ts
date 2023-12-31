import {
  attach,
  createEffect,
  createEvent,
  createStore,
  sample,
} from "effector";
import { createGate } from "effector-react";
import { Lang, Settings } from "shared/settings.types";
import { appModel } from "../app";
import { settingsApi } from "../../api";
import { applySettingsConstraints } from "./settings.constraints";
import { ChangeSettingsPayload } from "./settings.types";
import {
  DEFAULT_SETTINGS,
  SETTINGS_WORD_INVALIDATORS,
} from "./settings.constants";
import { invalidateWordsCache } from "../player/player.vendor";
import { values } from "lodash";

export const $settings = createStore<Settings>(DEFAULT_SETTINGS);
export const $settingsOnEditStarted = createStore<Settings>(DEFAULT_SETTINGS);

export const $voices = createStore<Partial<Record<Lang, Array<string>>>>({});

export const changeSettings = createEvent<ChangeSettingsPayload>();

export const SettingsGate = createGate();

// load settings
sample({
  clock: appModel.AppGate.open,
  target: settingsApi.loadSettingsFx,
});

sample({
  source: settingsApi.loadSettingsFx.doneData,
  target: $settings,
});

// load voices
values(Lang).forEach((lang) => {
  sample({
    clock: appModel.AppGate.open,
    fn: () => ({ lang }),
    target: settingsApi.loadVoicesFx,
  });

  sample({
    clock: settingsApi.loadVoicesFx.done,
    source: $voices,
    filter: (_, { params }) => params.lang === lang,
    fn: (voices, { result }) => ({ ...voices, [lang]: result }),
    target: $voices,
  });
});

sample({
  clock: [SettingsGate.open, settingsApi.loadSettingsFx.doneData],
  source: $settings,
  target: $settingsOnEditStarted,
});

// change settings
$settings.on(changeSettings, (settings, payload) => ({
  ...settings,
  [payload.field]: applySettingsConstraints(payload).value,
}));

// save on quit tab
sample({
  clock: SettingsGate.status,
  source: [$settings, $settingsOnEditStarted] as const,
  filter: (_, isOpen) => !isOpen,
  target: [
    attach({
      effect: settingsApi.changeSettingsFx,
      mapParams: ([settings]: [Settings]) => settings,
    }),
    createEffect<[Settings, Settings], void>(
      ([settings, settingsOnEditStarted]) => {
        if (
          SETTINGS_WORD_INVALIDATORS.some(
            (key) => settings[key] !== settingsOnEditStarted[key]
          )
        ) {
          invalidateWordsCache();
        }
      }
    ),
  ],
});

window.addEventListener("beforeunload", SettingsGate.close);

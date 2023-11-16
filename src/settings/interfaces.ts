import {DEFAULT_SETTINGS} from "./defaults";

export interface IGithubIssuesSettings {
    GithubToken: string,
    ShowIcon: boolean,
    InlinePrefix: string
}

export const SettingsData = Object.assign({}, DEFAULT_SETTINGS);

import {Plugin} from 'obsidian';
import {DEFAULT_SETTINGS} from "./settings/defaults";
import {IGithubIssuesSettings} from "./settings/interfaces";
import {GithubIssuesSettingsTab} from "./settings/main";

export default class GithubIssuesPlugin extends Plugin {
    settings: IGithubIssuesSettings;

    async onload() {
        await this.loadSettings();
        this.addSettingTab(new GithubIssuesSettingsTab(this.app, this));
    }

    onunload() {

    }

    async loadSettings() {
        this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
    }

    async saveSettings() {
        await this.saveData(this.settings);
    }
}

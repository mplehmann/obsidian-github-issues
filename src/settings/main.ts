import {App, PluginSettingTab, Setting} from "obsidian";
import GithubIssuesPlugin from "../main";
import {SettingsData} from "./interfaces";
import {DEFAULT_SETTINGS} from "./defaults";
import {Client} from "../github-client/main";

type SettingsChangeListener = () => void;

export class GithubIssuesSettingsTab extends PluginSettingTab {
    private _plugin: GithubIssuesPlugin
    private _onChangeCallback: SettingsChangeListener = () => {};

    constructor(app: App, plugin: GithubIssuesPlugin) {
        super(app, plugin);
        this._plugin = plugin;
    }

    display(): void {
        const { containerEl } = this;

        containerEl.empty();

        new Setting(containerEl)
            .setName("GitHub PAT")
            .setDesc("Used to authenticate with the GitHub API.")
            .addText(text => text
                .setPlaceholder("Enter your access token")
                .setValue(SettingsData.GithubToken)
                .onChange(async (value) => {
                    SettingsData.GithubToken = value;
                    await this.saveSettings();
                    Client.reauthenticate();
                })
            );
        new Setting(containerEl)
            .setName("Show GitHub icon")
            .setDesc("Show the GitHub logo in inline issues.")
            .addToggle(toggle => toggle
                .setValue(SettingsData.ShowIcon)
                .onChange(async (value) => {
                    SettingsData.ShowIcon = value;
                    await this.saveSettings();
                })
            );
        new Setting(containerEl)
            .setName("Inline issue prefix")
            .setDesc("Prefix used to mark inline issues.")
            .addText(text => text
                .setValue(SettingsData.InlinePrefix)
                .onChange(async (value) => {
                    SettingsData.InlinePrefix = value;
                    await this.saveSettings();
                })
            );
    }

    onChange(listener: SettingsChangeListener) {
        this._onChangeCallback = listener;
    }

    async loadSettings() {
        Object.assign(SettingsData, DEFAULT_SETTINGS, await this._plugin.loadData());
    }

    async saveSettings() {
        await this._plugin.saveData(SettingsData);
        this._onChangeCallback();
    }
}

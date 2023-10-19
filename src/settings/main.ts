import {App, PluginSettingTab, Setting} from "obsidian";
import GithubIssuesPlugin from "../main";

export class GithubIssuesSettingsTab extends PluginSettingTab {
    plugin: GithubIssuesPlugin

    constructor(app: App, plugin: GithubIssuesPlugin) {
        super(app, plugin);
        this.plugin = plugin;
    }

    display(): void {
        const { containerEl } = this;

        containerEl.empty();

        new Setting(containerEl)
            .setName("GitHub PAT")
            .setDesc("Used to authenticate with the GitHub API.")
            .addText(text => text
                .setPlaceholder("Enter your access token")
                .setValue(this.plugin.settings.GithubToken)
                .onChange(async (value) => {
                    this.plugin.settings.GithubToken = value;
                    await this.plugin.saveSettings();
                })
            );
        new Setting(containerEl)
            .setName("Show GitHub icon")
            .setDesc("Show the GitHub logo in inline issues.")
            .addToggle(toggle => toggle
                .setValue(this.plugin.settings.ShowIcon)
                .onChange(async (value) => {
                    this.plugin.settings.ShowIcon = value;
                    await this.plugin.saveSettings();
                })
            );
    }
}

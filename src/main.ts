import {Plugin} from 'obsidian';
import {GithubIssuesSettingsTab} from "./settings/main";
import {InlineIssuePostProcessor} from "./inline/main";
import {Client} from "./github-client/main";
import {GitHubViewPluginManager} from "./rendering/inlineEditorPlugin";

export default class GithubIssuesPlugin extends Plugin {
    private _settingsTab: GithubIssuesSettingsTab | null;
    private _editorPluginManager: GitHubViewPluginManager | null;

    async onload() {
        this._settingsTab = new GithubIssuesSettingsTab(this.app, this);
        await this._settingsTab.loadSettings();
        this._settingsTab.onChange(() => {
            if (this._editorPluginManager) { this._editorPluginManager.update(); }
            Client.clearCache();
        });
        this.addSettingTab(this._settingsTab);
        Client.reauthenticate();

        // Inline issues
        this.registerMarkdownPostProcessor(InlineIssuePostProcessor);
        this._editorPluginManager = new GitHubViewPluginManager();
        this.registerEditorExtension(this._editorPluginManager.getViewPlugin());
    }

    onunload() {
        this._settingsTab = null;
        this._editorPluginManager = null;
        Client.clearCache();
    }
}

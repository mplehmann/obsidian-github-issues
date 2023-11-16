import {
    Decoration,
    DecorationSet,
    EditorView,
    MatchDecorator, PluginSpec,
    PluginValue,
    ViewPlugin,
    ViewUpdate,
    WidgetType
} from "@codemirror/view";
import {RenderingCommon} from "./main";
import {RangeSet} from "@codemirror/state";
import {editorLivePreviewField} from "obsidian";
import {SettingsData} from "../settings/interfaces";
import {INLINE_REGEX} from "../inline/interfaces";

class GitHubInlineDisplayWidget extends WidgetType {
    private _domElement: HTMLElement = createSpan();
    private _user: string;
    private _repo: string | undefined;
    private _issue: string | undefined;

    constructor(user: string, repo?: string, issue?: string) {
        super();
        this._user = user;
        this._repo = repo;
        this._issue = issue;
        this.buildTag();
    }

    buildTag() {
        let rendered: Promise<HTMLSpanElement>;
        if (this._repo && this._issue) {
            rendered = RenderingCommon.renderIssue(this._user, this._repo, this._issue);
        } else if (this._repo) {
            rendered = RenderingCommon.renderRepo(this._user, this._repo);
        } else {
            rendered = RenderingCommon.renderUser(this._user);
        }

        rendered.then(element => this._domElement.replaceChildren(element));
    }

    toDOM(view: EditorView): HTMLElement {
        return this._domElement;
    }
}

class GitHubMatchDecorator extends MatchDecorator {
    constructor() {
        const regexp = new RegExp(`${SettingsData.InlinePrefix}:${INLINE_REGEX}`, 'g');

        super({
            regexp: regexp,
            decoration: GitHubMatchDecorator.createDecoration
        });
    }

    private static createDecoration(match: RegExpExecArray, view: EditorView, pos: number): Decoration {
        const user = match[1];
        const repo = match[2];
        const issue = match[3];
        const matchLength = match[0].length;

        if (!view.state.field(editorLivePreviewField) ||
            GitHubMatchDecorator.cursorInMatch(view, pos, matchLength) ||
            GitHubMatchDecorator.selectionContainsMatch(view, pos, matchLength)
        ) {
            return Decoration.mark({
                tagName: "span",
                class: "cm-inline-code"
            })
        } else {
            return Decoration.replace({
                widget: new GitHubInlineDisplayWidget(user, repo, issue)
            })
        }
    }

    private static cursorInMatch(view: EditorView, matchStart: number, matchLength: number): boolean {
        const cursorPos = view.state.selection.main.head;
        return cursorPos >= matchStart && cursorPos <= (matchStart + matchLength);
    }

    private static selectionContainsMatch(view: EditorView, matchStart: number, matchLength: number): boolean {
        const selectionStart = view.state.selection.main.from;
        const selectionEnd = view.state.selection.main.to;
        return selectionEnd >= matchStart && selectionStart <= (matchStart + matchLength);
    }
}

class GitHubViewPlugin implements PluginValue {
    private _decorations: DecorationSet;

    constructor(view: EditorView) {
        this.createDecorations(view);
    }

    getDecorations() { return this._decorations; }

    update(update: ViewUpdate) {
        const modeChanged =
            update.startState.field(editorLivePreviewField) !== update.state.field(editorLivePreviewField);
        const selectionChanged =
            update.startState.selection.main !== update.state.selection.main;
        if (update.docChanged || modeChanged || selectionChanged) {
            this.createDecorations(update.view);
        }
    }

    destroy() {
        this._decorations = RangeSet.empty;
    }

    private createDecorations(view: EditorView) {
        this._decorations = (globalMatchDecorator) ? globalMatchDecorator.createDeco(view) : RangeSet.empty;
    }
}

const GitHubViewPluginSpec: PluginSpec<GitHubViewPlugin> = {
    decorations: value => value.getDecorations()
}

let globalMatchDecorator: MatchDecorator | null = null;

export class GitHubViewPluginManager {
    private readonly _viewPlugin: ViewPlugin<PluginValue>;

    constructor() {
        this.updateGlobalDecorator();
        this._viewPlugin = ViewPlugin.fromClass(GitHubViewPlugin, GitHubViewPluginSpec);
    }

    getViewPlugin() { return this._viewPlugin; }

    update() {
        this.updateGlobalDecorator();
    }

    private updateGlobalDecorator() {
        if (SettingsData.InlinePrefix) {
            globalMatchDecorator = new GitHubMatchDecorator();
        } else {
            globalMatchDecorator = null;
        }
    }
}

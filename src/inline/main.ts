import {MarkdownPostProcessorContext} from "obsidian";
import {SettingsData} from "../settings/interfaces";
import {INLINE_REGEX} from "./interfaces";
import {RenderingCommon} from "../rendering/main";

const convertInlineToTags = async (el: HTMLElement): Promise<void> => {
    if (SettingsData.InlinePrefix) {
        const pattern = `${SettingsData.InlinePrefix}:${INLINE_REGEX}`;

        let match = new RegExp(pattern).exec(el.innerHTML);
        while (match) {
            const user = match[1];
            const repo = match[2];
            const issue = match[3];

            let replacement: HTMLSpanElement;
            if (issue) {
                replacement = await RenderingCommon.renderIssue(user, repo, issue);
            } else if (repo) {
                replacement = await RenderingCommon.renderRepo(user, repo);
            } else {
                replacement = await RenderingCommon.renderUser(user);
            }

            el.innerHTML = el.innerHTML.replace(match[0], replacement.outerHTML);
            match = new RegExp(pattern).exec(el.innerHTML)
        }
    }
}

export const InlineIssuePostProcessor = async (el: HTMLElement, ctx: MarkdownPostProcessorContext) => {
    await convertInlineToTags(el);
}

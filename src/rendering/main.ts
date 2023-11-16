import {Client} from "../github-client/main";
import {setIcon} from "obsidian";
import {Issue, IssueStates, Repo, User} from "../github-client/interfaces";

const userIcon = (user: User): string => user.type === "User" ? "user" : "building-2";
const repoIcon = (repo: Repo): string => repo.isTemplate ? "book-template" : "book-marked";
const issueIcon = (issue: Issue): string => {
    switch (issue.state) {
        case "Open":
            return (issue.isPullRequest) ? "git-pull-request" : "circle-dot";
        case "Closed":
            return (issue.isPullRequest) ? "git-merge" : "check-circle-2";
        case "Cancelled":
            return (issue.isPullRequest) ? "git-pull-request-closed" : "circle-slash";
        case "Draft":
            return (issue.isPullRequest) ? "git-pull-request-draft" : "circle-dot"
    }
}
const issueStatusClass = (status: IssueStates): string => {
    switch (status) {
        case "Draft":
            return "gh-issue-draft";
        case "Open":
            return "gh-issue-open";
        case "Closed":
            return "gh-issue-closed";
        case "Cancelled":
            return "gh-issue-cancelled";

    }
}

const renderWrapper = (lookupType: string, lookupValue: string): HTMLSpanElement => {
    const wrapperEl = createSpan({
            cls: "gh-wrapper",
            attr: {"data-lookup-type": lookupType, "data-lookup-value": lookupValue}
        });
    const leaderEl = wrapperEl.createSpan({ cls: "gh-segment gh-leader gh-icon"});
    setIcon(leaderEl, "github");

    return wrapperEl;
}

const renderError = (lookupValue: string, error: string, wrapper: HTMLSpanElement): HTMLSpanElement => {
    const valueEl = wrapper.createSpan({ cls: "gh-segment gh-icon gh-error-value" });
    setIcon(valueEl, "alert-octagon");
    valueEl.createSpan({ text: lookupValue });
    wrapper.createSpan({ cls: "gh-segment gh-error-message", text: error });

    return wrapper;
}

const renderUser = async (user: string): Promise<HTMLSpanElement> => {
    const response = await Client.getUser(user);
    const wrapper = renderWrapper("user", user);

    if (response.kind === "Error") {
        return renderError(user, response.errorMessage, wrapper);
    }

    const userSeg = wrapper.createSpan({ cls: "gh-segment gh-id gh-icon" });
    setIcon(userSeg, userIcon(response));
    userSeg.createEl("a", { href: response.url, text: response.login, title: response.url });
    wrapper.createSpan({ cls: "gh-segment gh-user-name", text: response.name });

    return wrapper;
}

const renderRepo = async (user: string, repo: string): Promise<HTMLSpanElement> => {
    const response = await Client.getRepo(user, repo);
    const wrapper = renderWrapper("user", user);

    if (response.kind === "Error") {
        return renderError(`${user}/${repo}`, response.errorMessage, wrapper);
    }

    const repoSeg = wrapper.createSpan({ cls: "gh-segment gh-id gh-icon", text: repo });
    setIcon(repoSeg, repoIcon(response));
    repoSeg.createEl("a", { href: response.url, title: response.url, text: response.name });

    wrapper.createSpan({ cls: "gh-segment gh-repo-name", text: response.description });

    return wrapper;
}

const renderIssue = async (user: string, repo: string, issue: string): Promise<HTMLSpanElement> => {
    const response = await Client.getIssue(user, repo, Number(issue));
    const wrapper = renderWrapper("user", user);

    if (response.kind === "Error") {
        return renderError(`${user}/${repo}#${issue}`, response.errorMessage, wrapper);
    }

    const repoSeg = wrapper.createSpan({ cls: "gh-segment gh-id gh-icon", text: repo });
    setIcon(repoSeg, issueIcon(response));
    repoSeg.createEl("a", { href: response.url, title: response.url, text: `${response.repo}#${response.id}` });

    wrapper.createSpan({ cls: "gh-segment gh-issue-title", text: response.title });
    wrapper.createSpan({ cls: `gh-segment ${issueStatusClass(response.state)}`, text: response.state })

    return wrapper;
}

export const RenderingCommon  = {
    renderWrapper: renderWrapper,
    renderUser: renderUser,
    renderRepo: renderRepo,
    renderIssue: renderIssue
}

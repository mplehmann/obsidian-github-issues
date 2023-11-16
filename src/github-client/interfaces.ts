export type User = {
    kind: "User",
    login: string;
    name: string;
    type: "Organization" | "User";
    url: string;
}

export type Repo = {
    kind: "Repo",
    owner: string;
    name: string;
    fullName: string;
    description: string;
    url: string;
    isTemplate: boolean;
    isArchived: boolean;
}

export type IssueStates = "Draft" | "Open" | "Closed" | "Cancelled";
export type Issue = {
    kind: "Issue",
    owner: string;
    repo: string;
    id: number;
    title: string;
    url: string;
    state: IssueStates;
    isDraft: boolean;
    isPullRequest: boolean;
}

export type GitHubError = {
    kind: "Error",
    requestValue: string;
    errorMessage: string;
}

export interface IGitHubClient {
    getUser: (user: string) => Promise<User | GitHubError>;
    getRepo: (user: string, repo: string) => Promise<Repo | GitHubError>;
    getIssue: (user: string, repo: string, issue: number) => Promise<Issue | GitHubError>;
}

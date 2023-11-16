import {GitHubError, IGitHubClient, Issue, IssueStates, Repo, User} from "./interfaces";
import {Octokit} from "@octokit/rest";
import {SettingsData} from "../settings/interfaces";

const CacheExpirationMs = 5 * 60 * 1000;

type CacheableTypes = User | Repo | Issue | GitHubError;
type CacheItem = {
    data: CacheableTypes,
    expiration: number
}

type CacheData = {
    [key: string]: CacheItem
}

class ObjectCache {
    private _cacheData: CacheData;

    constructor() {
        this._cacheData = {};
    }

    get(key: string): CacheableTypes | undefined {
        if (key in this._cacheData) {
            const cacheItem = this._cacheData[key];
            if (cacheItem.expiration < Date.now()) {
                this.remove(key);
                return undefined;
            } else {
                return cacheItem.data;
            }
        } else {
            return undefined;
        }
    }

    set(key: string, data: CacheableTypes): void {
        this._cacheData[key] = {
            data: data,
            expiration: Date.now() + CacheExpirationMs
        };
    }

    remove(key: string): void {
        delete this._cacheData[key];
    }

    clear(): void {
        this._cacheData = {};
    }
}

class GitHubClient implements IGitHubClient {
    private _client: Octokit;
    private _cache: ObjectCache;

    constructor() {
        this.reauthenticate();
        this._cache = new ObjectCache();
    }

    reauthenticate() {
        this._client = new Octokit({
            auth: SettingsData.GithubToken
        });
    }

    async getUser(user: string): Promise<User | GitHubError> {
        const cached = this._cache.get(user);
        if (cached && (cached.kind === "User" || cached.kind === "Error")) {
            return cached;
        }

        let userOrError: User | GitHubError;
        try {
            const response = await this._client.users.getByUsername({username: user});
            userOrError = {
                kind: "User",
                login: response.data.login,
                name: response.data.name ?? response.data.login,
                type: (response.data.type === "User") ? "User" : "Organization",
                url: response.data.html_url
            };
        } catch (error) {
            let errorMessage = "Unknown error calling GitHub";
            if (error.response) {
                errorMessage = error.response.data.message;
            }
            userOrError = {
                kind: "Error",
                requestValue: user,
                errorMessage: errorMessage,
            };
        }

        this._cache.set(user, userOrError);
        return userOrError;
    }

    async getRepo(user: string, repo: string): Promise<Repo | GitHubError> {
        const cacheKey = `${user}/${repo}`;
        const cached = this._cache.get(cacheKey);
        if (cached && (cached.kind === "Repo" || cached.kind === "Error")) {
            return cached;
        }

        let repoOrError: Repo | GitHubError;
        try {
            const response = await this._client.repos.get({ owner: user, repo: repo });
            repoOrError = {
                kind: "Repo",
                owner: response.data.owner.login,
                name: response.data.name,
                fullName: response.data.full_name,
                description: response.data.description ?? response.data.full_name,
                url: response.data.html_url,
                isTemplate: response.data.is_template ?? false,
                isArchived: response.data.archived
            };
        } catch (error) {
            let errorMessage = "Unknown error calling GitHub";
            if (error.response) {
                errorMessage = error.response.data.message;
            }
            repoOrError = {
                kind: "Error",
                requestValue: cacheKey,
                errorMessage: errorMessage
            };
        }

        this._cache.set(cacheKey, repoOrError);
        return repoOrError;
    }

    async getIssue(user: string, repo: string, issue: number): Promise<Issue | GitHubError> {
        const cacheKey = `${user}/${repo}#${issue}`;
        const cached = this._cache.get(cacheKey);
        if (cached && (cached.kind === "Issue" || cached.kind === "Error")) {
            return cached;
        }

        let issueOrError: Issue | GitHubError;
        try {
            const response = await this._client.issues.get({ owner: user, repo: repo, issue_number: issue });

            let issueState: IssueStates;
            if (response.data.state === "open") {
                issueState = (response.data.draft ?? false) ? "Draft" : "Open";
            } else if (response.data.pull_request) {
                issueState = (response.data.pull_request.merged_at) ? "Closed" : "Cancelled";
            } else {
                issueState = (response.data.state_reason === "completed") ? "Closed" : "Cancelled";
            }

            issueOrError = {
                kind: "Issue",
                owner: user,
                repo: repo,
                id: response.data.number,
                title: response.data.title,
                url: response.data.html_url,
                state: issueState,
                isDraft: response.data.draft ?? false,
                isPullRequest: !!response.data.pull_request
            };
        } catch (error) {
            let errorMessage = "Unknown error calling GitHub";
            if (error.response) {
                errorMessage = error.response.data.message;
            }
            issueOrError = {
                kind: "Error",
                requestValue: cacheKey,
                errorMessage: errorMessage
            };
        }

        this._cache.set(cacheKey, issueOrError);
        return issueOrError;
    }

    clearCache(): void {
        this._cache.clear();
    }
}

export const Client = new GitHubClient();

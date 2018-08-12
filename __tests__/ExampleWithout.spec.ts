describe("Example model without using the library for GitHub issues", () => {
    enum GHIssueState {
        Open = 0,
        Closed,
    }

    class GHUser {
        public readonly username: string;
        public readonly url: string;
        public readonly htmlUrl: string;

        constructor(json: any) {
            this.username = json.login;
            this.url = json.url;
            this.htmlUrl = json.html_url;
        }
    }

    class GHIssue {
        public readonly url: string;
        public readonly htmlUrl: string;
        public readonly number: number;
        public readonly state: GHIssueState;
        public readonly reporterLogin: string;
        public readonly assignee: GHUser;
        public readonly assignees: GHUser[];
        public readonly updatedAt: Date;

        public title: string;
        public body: string;

        public retrievedAt: Date;

        constructor(json: any) {
            this.url = json.url;
            this.htmlUrl = json.html_url;
            this.number = json.number;

            if (json.state === "open") {
                this.state = GHIssueState.Open;
            } else if (json.state === "closed") {
                this.state = GHIssueState.Closed;
            }

            this.title = json.title;
            this.body = json.body;
            this.reporterLogin = json.user.login;
            this.updatedAt = new Date(json.updated_at);
            this.assignee = new GHUser(json.assignee);

            const assignees: GHUser[] = [];
            for (const assigneeJSON of json.assignees) {
                const assignee = new GHUser(assigneeJSON);
                assignees.push(assignee);
            }
            this.assignees = assignees;

            this.retrievedAt = new Date();
        }
    }

    it("Should work", () => {
        const values = {
            "url": "https://api.github.com/repos/octocat/Hello-World/issues/1347",
            "html_url": "https://github.com/octocat/Hello-World/issues/1347",
            "number": 1347,
            "state": "open",
            "title": "Found a bug",
            "body": "I'm having a problem with this.",
            "user": {
                "login": "octocat",
            },
            "assignee": {
                "login": "octocat",
                "url": "https://api.github.com/users/octocat",
                "html_url": "https://github.com/octocat",
            },
            "assignees": [
                {
                    "login": "octocat",
                    "url": "https://api.github.com/users/octocat",
                    "html_url": "https://github.com/octocat",
                },
            ],
            "updated_at": "2011-04-22T13:33:48.000Z",
        };

        let model: GHIssue;
        let error: Error;

        try {
            model = new GHIssue(values);
        } catch (err) {
            error = err;
        }

        expect(error).toBeUndefined();
        expect(model).toBeDefined();

        expect(model.url).toEqual("https://api.github.com/repos/octocat/Hello-World/issues/1347");
        expect(model.htmlUrl).toEqual("https://github.com/octocat/Hello-World/issues/1347");
        expect(model.number).toEqual(1347);
        expect(model.state).toEqual(GHIssueState.Open);
        expect(model.reporterLogin).toEqual("octocat");
        expect(model.assignee).toBeDefined();
        expect(model.assignee.username).toEqual("octocat");
        expect(model.assignee.url).toEqual("https://api.github.com/users/octocat");
        expect(model.assignee.htmlUrl).toEqual("https://github.com/octocat");
        expect(model.assignees).toBeDefined();
        expect(model.assignees.length).toEqual(1);
        expect(model.assignees[0].username).toEqual("octocat");
        expect(model.assignees[0].url).toEqual("https://api.github.com/users/octocat");
        expect(model.assignees[0].htmlUrl).toEqual("https://github.com/octocat");
        expect(model.updatedAt).toEqual(new Date("2011-04-22T13:33:48.000Z"));
        expect(model.title).toEqual("Found a bug");
        expect(model.body).toEqual("I'm having a problem with this.");
        expect(model.retrievedAt).toBeDefined();
        expect(model.retrievedAt).not.toBeNull();
    });
});

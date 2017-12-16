const semver = require('semver');

const { format, createChecklist } = require('./utilities/message');
const { getStatus } = require('./utilities/status');

module.exports = class SERTBot {
  constructor(context, config) {
    this.context = context;
    this.github = context.github;
    this.config = config;
    this.logger = config.logger || console;
    this.repository = {
      owner: context.payload.repository.owner.login,
      repo: context.payload.repository.name
    };
  }

  get enabled() {
    return this.config.enabled;
  }

  async setupRepository() {
    const labels = this.config.labels;
    const labelNames = labels.map(l => l.name);
    const existingLabels = await this.github.issues.getLabels({
      ...this.repository,
      per_page: 100
    });
    const existingLabelNames = existingLabels.data.map(l => l.name);

    const labelsToRemove = existingLabels.data.filter(
      l => !labelNames.includes(l.name)
    );

    labelsToRemove.forEach(label =>
      this.github.issues.deleteLabel({ ...this.repository, ...label })
    );

    labels.forEach(label => {
      if (!existingLabelNames.includes(label.name)) {
        this.github.issues.createLabel({ ...this.repository, ...label });
      }
    });
  }

  async setupPullRequest(issue) {
    const expression = /^\[(MAJOR|MINOR|PATCH)\] v([0-9]+\.[0-9]+\.[0-9]+)$/gi;
    const matches = expression.exec(issue.title);

    if (matches) {
      this.github.issues.addLabels({
        ...this.repository,
        number: issue.number,
        labels: ['type/release']
      });
    } else {
      this.github.issues.addLabels({
        ...this.repository,
        number: issue.number,
        labels: [
          'process/needs-triage',
          'process/review-pending'
        ]
      });
    }
  }

  async checkReleaseTitle(issue) {
    const expression = /^\[(MAJOR|MINOR|PATCH)\] v([0-9]+\.[0-9]+\.[0-9]+)$/gi;
    const matches = expression.exec(issue.title);

    if (matches) {
      const type = matches[1].toLowerCase();
      const version = semver.clean(matches[2]);

      let latestVersion = '';
      try {
        latestVersion = await this.github.repos.getLatestRelease(
          this.repository
        );
      } catch (e) {
        latestVersion = '0.0.0';
      }

      const expectedVersion = semver.inc(latestVersion, type);

      const state = version === expectedVersion ? 'success' : 'failure';

      this.github.repos.createStatus(
        getStatus(issue, this.config.statuses.semver, state, {
          expected: expectedVersion,
          found: matches[2]
        })
      );
    }
  }

  async createChecklistComment(issue) {
    const pullRequest = await this.github.pullRequests.get({
      ...this.repository,
      number: issue.number
    });
    const type =
      pullRequest.data.base.ref === this.config.primary_branch
        ? 'release'
        : 'change';
    const checklist = this.config.checklists[type];

    this.github.issues.addLabels({
      ...this.repository,
      number: issue.number,
      labels: ['process/checklist-pending']
    });

    this.github.issues.createComment({
      ...this.repository,
      number: issue.number,
      body: createChecklist(type, checklist, {
        name: pullRequest.data.user.login
      })
    });

    this.github.repos.createStatus(
      getStatus(issue, this.config.statuses.checklist, 'pending', {
        completed: 0,
        total: this.config.checklists.release.length
      })
    );
  }

  async updateChecklistStatus({ issue, comment }) {
    const pullRequest = await this.github.pullRequests.get({
      ...this.repository,
      number: issue.number
    });

    const incomplete = (comment.body.match(/- \[ \]/gi) || []).length;
    const complete = (comment.body.match(/- \[x\]/gi) || []).length;

    const total = incomplete + complete;

    const state = complete === total ? 'success' : 'pending';

    this.github.repos.createStatus(
      getStatus(pullRequest.data, this.config.statuses.checklist, state, {
        completed: complete,
        total: total
      })
    );
  }

  async mergePullRequest({ issue, comment }) {
    const labelNames = issue.labels.map(l => l.name);
    const pullRequest = await this.github.pullRequests.get({
      ...this.repository,
      number: issue.number
    });

    const statusResp = await this.github.repos.getStatuses({
      ...this.repository,
      ref: pullRequest.data.head.sha
    });
    const statuses = statusResp.data || [];
    const statusesContexts = statuses.map(s => s.context);

    let type = 'change';
    if (labelNames.includes('type/release')) {
      type = 'release';
    }

    const statusesSuccessful = statuses.some(
      status => status.state === 'success'
    );

    const hasRequiredStatuses = this.config.required_statuses[type].every(
      required => statusesContexts.includes(required)
    );

    // Verify checks
    // Verify the PR is approved
    if (statusesSuccessful && hasRequiredStatuses) {
      this.github.pullRequests.merge({
        ...this.repository,
        number: issue.number,
        merge_method: 'rebase'
      });

      ['process/approved', 'process/checklist-done'].forEach(name => {
        if (labelNames.includes(name)) {
          this.github.issues.removeLabel({
            ...this.repository,
            number: issue.number,
            name
          })
        }
      });

      this.github.issues.createComment({
        ...this.repository,
        number: issue.number,
        body: format('merge/success.md', { name: comment.user.login })
      });
    } else {
      this.github.issues.createComment({
        ...this.repository,
        number: issue.number,
        body: format('merge/awaiting-checks.md', { name: comment.user.login })
      });
    }
  }

  // Check user's teams
  async getUserTeams(name) {}
};

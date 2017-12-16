const SERTBot = require('./lib/SERTBot');
const defaults = require('./lib/defaults');

module.exports = robot => {
  robot.on('repository.created', repositoryCreated);
  robot.on('pull_request.opened', pullRequestOpened);
  robot.on('issue_comment.created', issueCommentCreated);
  robot.on('issue_comment.edited', issueCommentEdited);

  // Handlers

  async function repositoryCreated(context) {
    const bot = await forRepository(context);

    if (!bot.enabled) return;

    // Perform basic repository setup
    bot.setupRepository();
  }

  async function pullRequestOpened(context) {
    const bot = await forRepository(context);
    const issue = context.payload.issue || context.payload.pull_request;

    if (!bot.enabled) return;

    bot.setupPullRequest(issue);

    // Check release title formatting
    bot.checkReleaseTitle(issue);
    bot.createChecklistComment(issue);
  }

  async function issueCommentCreated(context) {
    const bot = await forRepository(context);
    const comment = context.payload.comment;

    if (!bot.enabled) return;

    switch (comment.body.toLowerCase()) {
      case '@sertbot merge':
        bot.mergePullRequest(context.payload);
    }
  }

  async function issueCommentEdited(context) {
    const bot = await forRepository(context);
    const comment = context.payload.comment;

    if (!bot.enabled) return;

    if (
      comment.user.login === 'sertbot[bot]' &&
      comment.body.includes('<!-- checklist -->')
    ) {
      bot.updateChecklistStatus(context.payload);
    }
  }

  // Get bot class for a repository
  async function forRepository(context) {
    const config = await context.config('sertbot.yml', defaults);
    const bot = new SERTBot(context, config);

    if (config.enabled) bot.setupRepository();

    return bot;
  }
};

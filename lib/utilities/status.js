const handlebars = require('handlebars');

module.exports.getStatus = (issue, status, state, payload = {}) => ({
  owner: issue.head.repo.owner.login,
  repo: issue.head.repo.name,
  sha: issue.head.sha,
  state: state,
  description: handlebars.compile(status.description)(payload),
  context: status.context
});

const fs = require('fs');
const handlebars = require('handlebars');

module.exports.format = (template, payload = {}) => {
  const templateLocation = `${__dirname}/../templates/${template}`;
  let templateString;

  try {
    templateString = fs.readFileSync(templateLocation).toString();
  } catch (e) {
    return '';
  }

  templateString = templateString.replace(/(^|[^\n])\n(?!\n)/g, '$1 ');

  return handlebars.compile(templateString)(payload);
};

module.exports.createChecklist = (type, checklist, payload = {}) =>
  module.exports.format(`checklist/${type}.md`, { checklist, ...payload });

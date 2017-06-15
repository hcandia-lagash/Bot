var builder = require('botbuilder');

var EmailRegex = new RegExp(/[a-z0-9!#$%&'*+\/=?^_`{|}~-]+(?:\.[a-z0-9!#$%&'*+\/=?^_`{|}~-]+)*@(?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\.)+[a-z0-9](?:[a-z0-9-]*[a-z0-9])?/);

const library = new builder.Library('validators');

library.dialog('email',
    builder.DialogAction.validatedPrompt(builder.PromptType.text, (response) =>
        EmailRegex.test(response)));

module.exports = library;
module.exports.EmailRegex = EmailRegex;
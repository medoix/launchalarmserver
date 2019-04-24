'use strict';

var Handlebars = require('handlebars');

module.exports = {

    /**
     * @name addLabels
     * @function addLabels (Handlebars helper)
     * @description Adds the correct color label tag to the project
     * @returns {Handlebars.SafeString}
     */
    addLabels: function () {

        let platform = this.toUpperCase();

        switch (platform) {

            case 'ANDROID':
                return new Handlebars.SafeString('<div class="ui green tag label">' + this + '</div>');
            case 'IOS':
                return new Handlebars.SafeString('<div class="ui black tag label">' + this + '</div>');
            case 'WEB':
                return new Handlebars.SafeString('<div class="ui orange tag label">' + this + '</div>');
            case 'GO':
                return new Handlebars.SafeString('<div class="ui blue tag label">' + this + '</div>');
            case 'NODE':
                return new Handlebars.SafeString('<div class="ui red tag label">' + this + '</div>');
            default:
                return new Handlebars.SafeString('<div class="ui label">' + this + '</div>');

        }

    },

    /**
     * @name processHtml
     * @function processHtml (Handlebars helper)
     * @description allows input String to be processed as HTML by handlebars
     * @returns {Handlebars.SafeString}
     */
    processHtml: function (htmlSnippet) {

        return new Handlebars.SafeString(htmlSnippet);

    }

};

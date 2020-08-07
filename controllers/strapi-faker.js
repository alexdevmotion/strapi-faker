'use strict';

module.exports = {

  /**
   * Default action.
   *
   * @return {Object}
   */

  async up(ctx) {
    strapi.plugins['strapi-faker'].services['strapi-faker'].up();
    ctx.send('Strapi-faker up triggered. Check out the server console!');
  },

  async down(ctx) {
    strapi.plugins['strapi-faker'].services['strapi-faker'].down();
    ctx.send('Strapi-faker down triggered. Check out the server console!');
  }

};

'use strict';

/**
 * strapi-faker.js controller
 *
 * @description: A set of functions called "actions" of the `strapi-faker` plugin.
 */

module.exports = {

  /**
   * Default action.
   *
   * @return {Object}
   */

  up: async (ctx) => {
    // Add your own logic here.

    // Send 200 `ok`
    ctx.send({
      message: 'ok'
    });
  },

  down: async (ctx) => {
    // Add your own logic here.

    // Send 200 `ok`
    ctx.send({
      message: 'ok'
    });
  }

};

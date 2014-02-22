module.exports = (function() {
  var Router = require('router');

  require('lib/config');
  require('lib/helpers');

  window.App = {};

  App.Router = new Router();

  App.User = _.createModel('user');
  App.Boards = _.createCollection('boards');
  App.Accounts = _.createCollection('accounts');

  App.User.signinFromCache();
  App.Router.start();
})();
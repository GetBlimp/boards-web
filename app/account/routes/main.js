module.exports = function(account) {
  if (!this.User.isSignedIn()) {
    this.navigate('/signin/', {trigger: true});
  } else {
    this.setController(require('account/controller'), {
      account: account,
      comesFromAccountPage: this.isCurrentController('Activity') ? true : void 0
    });
  }
};

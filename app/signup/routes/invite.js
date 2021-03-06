module.exports = function(token) {
  if (this.User.isSignedIn() && !token) {
    this.navigate('/accounts/', {trigger: true});
  } else if (!token) {
    this.navigate('', {trigger: true});
  } else {
    this.setController(require('signup/controller'), {
      inviteToken: token
    });

    this.controller.renderLayout(true);
    this.controller.signupWithInvite();
  }
};

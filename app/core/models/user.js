var Person = require('core/models/person');

module.exports = Person.extend({
  url: App.API_URL + '/users/me/',

  cacheId: 'User',

  defaults: {
    is_invite: false,
    is_signin: false,
    is_recovering_password: false,
    signup_step: 'request-signup',
    allow_signup: false,
    passwordResetData: {},
    requesting_account: {},
    account_logo_color: ['red', 'green', 'orange', 'purple'][_.random(0, 3)]
  },

  subscriptions: {
    'user:id': 'respondWithId',
    'user:accounts': 'respondAccounts'
  },

  localAttributes: ['signup_step', 'passwordReset', 'is_invite', 'requesting_account', 'is_recovering_password'],

  validations: {
    username: function(username) {
      var isSignin = this.get('is_signin'),
          isCurrentStep = this.get('signup_step') === 'complete-signup';

      if (!username && (isCurrentStep || isSignin || this.has('token'))) {
        return 'A username is required to authenticate you.';
      } else if (!Z.Validations.isAlphanumeric(username) && (isCurrentStep || isSignin)) {
        return 'Your username must be an alphanumeric value.';
      }
    },

    email: function(email) {
      var isCurrentStep = this.get('signup_step') === 'validate-email',
          isRecoveringPass = this.get('is_recovering_password');

      if (!email && (isCurrentStep || isRecoveringPass || this.has('token'))) {
        return 'An email is required to authenticate you.';
      } else if (!Z.Validations.isEmail(email) && (isCurrentStep || isRecoveringPass)) {
        return 'Provide a valid email.';
      }
    },

    password: function(password) {
      var isSignin = this.get('is_signin'),
          isCurrentStep = this.get('signup_step') === 'complete-signup',
          isRecoveringPass = this.get('is_recovering_password');

      if (!password && (isCurrentStep || isSignin || isRecoveringPass)) {
        return 'A password is required to authenticate you.';
      } else if (!Z.Validations.isOfMinimumLength(password, 6) && (isCurrentStep || isSignin || isRecoveringPass)) {
        return 'Your password must have a minimun of 6 characters.';
      }
    }
  },

  initialize: function() {
    this.on('sync', function(user, response) {
      this.cache.set(response);
    }, this);
  },

  requestSignup: function(email) {
    email = JSON.stringify({email: email || this.get('email')});

    $.post(App.API_URL + '/auth/signup_request/', email)
      .done(_.bind(this.onRequestSignupSuccess, this))
      .fail(_.bind(this.onRequestSignupError, this));

    return this;
  },

  onRequestSignupSuccess: function(response) {
    this.set(response).trigger('user:signup-request:success', response);
    return this;
  },

  onRequestSignupError: function(error) {
    error = error.responseJSON ? error.responseJSON.error : error;
    error = error.email ? error.email[0] : 'An error ocurred.';
    this.trigger('user:signup-request:error', error);
    return this;
  },

  hasInvitation: function() {
    return this.get('is_invite') === true || this.has('invited_user_token');
  },

  rejectInvitation: function(token) {
    token = token || this.get('invited_user_token');

    return $.ajax({
      url: App.API_URL + '/auth/invitations/' + token + '/reject/',
      method: 'PUT',
      error: _.bind(function(response) {
        this.broadcast('user:reject-invite:error', response);
      }, this),
      success: _.bind(function(response) {
        this.set('is_invite', false);
        this.unset('invited_user_token');
        this.broadcast('user:reject-invite:success', response);
        this.saveCache();
      }, this)
    });
  },

  acceptInvitation: function(token) {
    token = token || this.get('invited_user_token');

    return $.ajax({
      url: App.API_URL + '/auth/invitations/' + token + '/accept/',
      method: 'PUT',
      error: _.bind(function(response) {
        this.broadcast('user:accept-invite:error', response);
      }, this),
      success: _.bind(function(response) {
        this.set('is_invite', false);
        this.unset('invited_user_token');
        this.broadcast('user:accept-invite:success', response);
        this.saveCache();
      }, this)
    });
  },

  requestInvite: function(email, account) {
    var data = JSON.stringify({
      email: email || this.get('email'),
      account: account || this.get('requesting_account').id
    });

    $.post(App.API_URL + '/auth/signup_request/invite/', data)
      .done(_.bind(this.onRequestInviteSuccess, this))
      .fail(_.bind(this.onRequestInviteError, this));

    return this;
  },

  onRequestInviteSuccess: function(response) {
    this.set(response).trigger('user:request-invite:success', response);
    return this;
  },

  onRequestInviteError: function(error) {
    error = error.responseJSON ? error.responseJSON.error : error;
    error = error.email ? error.email[0] : 'An error ocurred.';
    error = error.account ? error.account[0] : 'An error ocurred.';
    this.trigger('user:request-invite', error);
    return this;
  },

  setEmailFromJWT: function(token) {
    var tokenData;

    token = token || '';
    token = token.replace(/^=/, '');
    tokenData = _.decodeJWT(token);

    if (tokenData.email) this.set({
      'email': tokenData.email,
      'signup_request_token': token
    }).saveCache();

    return this;
  },

  setEmailFromInviteJWT: function(token) {
    var tokenData;

    token = token || '';
    token = token.replace(/^=/, '');
    tokenData = _.decodeJWT(token);

    if (tokenData.email) this.set({
      'email': tokenData.email,
      'invited_user_token': token
    }).saveCache();

    return this;
  },

  isWaitingForEmailValidation: function() {
    return this.has('email') && this.get('signup_step') === 2;
  },

  updateSignupStep: function(step) {
    this.set('signup_step', step).saveCache();
    return this;
  },

  checkSignupEmailDomain: function(domains) {
    domains = JSON.stringify({signup_domain: domains});

    if (!domains) {
      this.onValidateSignupEmailDomainError({signup_domain: ['Provide a valid domain name.']});
    } else {
      $.post(App.API_URL + '/auth/signup_domains/check/', domains)
        .done(_.bind(this.onCheckSignupEmailDomainSuccess, this))
        .fail(_.bind(this.onCheckSignupEmailDomainError, this));
    }

    return this;
  },

  onCheckSignupEmailDomainSuccess: function(response) {
    this.trigger('user:check-domain:success', response);
    return this;
  },

  onCheckSignupEmailDomainError: function(error) {
    error = error.responseJSON ? error.responseJSON.error : error;
    error = error.signup_domain ? error.signup_domain[0] : 'An error ocurred.';
    this.trigger('user:check-domain:error', error);
    return this;
  },


  validateSignupEmailDomain: function(domains) {
    domains = JSON.stringify({signup_domains: domains});

    if (!domains) {
      this.onValidateSignupEmailDomainError({signup_domains: ['Provide a valid domain name.']});
    } else {
      $.post(App.API_URL + '/auth/signup_domains/validate/', domains)
        .done(_.bind(this.onValidateSignupEmailDomainSuccess, this))
        .fail(_.bind(this.onValidateSignupEmailDomainError, this));
    }

    return this;
  },

  onValidateSignupEmailDomainSuccess: function(response) {
    this.set(response).trigger('user:signup-domains:success', response);
    return this;
  },

  onValidateSignupEmailDomainError: function(error) {
    error = error.responseJSON ? error.responseJSON.error : error;
    error = error.signup_domains ? error.signup_domains[0] : 'An error ocurred.';
    this.trigger('user:signup-domains:error', error);
    return this;
  },

  hasInviteDomains: function() {
    return this.has('signup_domains') && this.get('signup_domains').length > 0;
  },

  validateUsername: function(username) {
    username = JSON.stringify({username: username || this.get('username')});

    $.post(App.API_URL + '/auth/username/validate/', username)
      .done(_.bind(this.onValidateUsernameSuccess, this))
      .fail(_.bind(this.onValidateUsernameError, this));

    return this;
  },

  onValidateUsernameSuccess: function(response) {
    this.set(response).trigger('user:signup-username:success', response);
    return this;
  },

  onValidateUsernameError: function(error) {
    error = error.responseJSON ? error.responseJSON.error : error;
    error = error.username ? error.username[0] : 'An error ocurred.';
    this.trigger('user:signup-username:error', error);
    return this;
  },

  signup: function(credentials) {
    credentials = JSON.stringify(credentials || this.toJSON());

    $.post(App.API_URL + '/auth/signup/', credentials)
      .done(_.bind(this.onSignupSuccess, this))
      .fail(_.bind(this.onSignupError, this));

    return this;
  },

  onSignupSuccess: function(response) {
    this.set(response)
      .unset('password')
      .unset('signup_step')
      .unset('signup_request_token')
      .unset('passwordReset')
      .unset('is_invite')
      .unset('requesting_account')
      .unset('account_logo_color')
      .saveCache();

    this.broadcast('user:signup:success', response);
    return this;
  },

  onSignupError: function(error) {
    error = error.responseJSON ? error.responseJSON.error : error;
    error = error.email || error.username || error.password;
    error = error ? error[0] : 'An error ocurred.';
    this.broadcast('user:signup:error', error);
    return this;
  },

  signin: function(username, password) {
    var credentials = {};

    this.unset('email');

    if (username && password) {
      credentials.username = username;
      credentials.password = password;
    } else if (this.get('username') && this.get('password')) {
      credentials.username = this.get('username');
      credentials.password = this.get('password');
    }

    if (this.has('invited_user_token')) {
      credentials.invited_user_token = this.get('invited_user_token');
    }

    if (!_.size(credentials)) this.onSigninError({
      username: ['Credentials are required to signin.'],
      password: ['Credentials are required to signin.']
    });

    credentials = JSON.stringify(credentials);

    $.post(App.API_URL + '/auth/signin/', credentials)
      .done(_.bind(this.onSigninSuccess, this))
      .fail(_.bind(this.onSigninError, this));

    return this;
  },

  signinFromCache: function() {
    this.fetchCache();
    if (this.isSignedIn()) this.onSigninSuccess(this.attributes);
    return this;
  },

  onSigninSuccess: function(response) {
    this.unset('password').set(response).saveCache();
    this.broadcast('user:signin:success', response);

    if (!App.DEBUG) {
      Raven.setUser({
        id: this.id,
        email: this.get('email'),
        username: this.get('username')
      });
    }

    if (typeof olark !== 'undefined') {
      olark('api.chat.updateVisitorNickname', {
          snippet: this.get('email') + ' #' + this.id
      });
    }

    return this;
  },

  onSigninError: function(error) {
    error = error.responseJSON ? error.responseJSON.error : error;

    if (error.email) {
      error = error.email[0] || 'An error ocurred.';
    }

    if (error.password) {
      error = error.password[0] || 'An error ocurred.';
    }

    if (error.non_field_errors) {
      error = error.non_field_errors[0] || 'An error ocurred.';
    }

    this.broadcast('user:signin:error', error);
    return this;
  },

  isSignedIn: function() {
    return this.has('token');
  },

  signout: function() {
    this.clear();
    this.destroyCache();
    this.broadcast('user:signout');
    return this;
  },

  forgotPassword: function(email) {
    email = JSON.stringify({email: email || this.get('email')});

    $.post(App.API_URL + '/auth/forgot_password/', email)
      .done(_.bind(this.onForgotPasswordSuccess, this))
      .fail(_.bind(this.onForgotPasswordError, this));

    return this;
  },

  onForgotPasswordSuccess: function(response) {
    this.set(response)
      .unset('email')
      .unset('is_recovering_password')
      .saveCache()
      .trigger('user:forgot-password:success', response);

    return this;
  },

  onForgotPasswordError: function(error) {
    error = error.responseJSON ? error.responseJSON.error : error;
    error = error.email ? error.email[0] : 'An error ocurred';
    this.trigger('user:forgot-password:error', error);
    return this;
  },

  setPasswordResetDataFromJWT: function(token) {
    var tokenData;

    token = token || '';
    token = token.replace(/^=/, '');
    tokenData = _.decodeJWT(token);

    if (tokenData.type === 'PasswordReset') {
      this.set({
        passwordResetData: {
          id: tokenData.id,
          type: tokenData.type,
          token: token,
          version: tokenData.token_version
        }
      }).saveCache();
    }

    return this;
  },

  canResetPassword: function() {
    var reset = this.get('passwordResetData');

    if (reset && reset.token && reset.type === 'PasswordReset') {
      return true;
    } else {
      return false;
    }
  },

  resetPassword: function(password) {
    data = JSON.stringify({
      token: this.get('passwordResetData').token,
      password: password || this.get('password')
    });

    if (this.canResetPassword()) {
      $.post(App.API_URL + '/auth/reset_password/', data)
        .done(_.bind(this.onResetPasswordSuccess, this))
        .fail(_.bind(this.onResetPasswordError, this));
    } else {
      this.onResetPasswordError({token: ['A valid token is required to reset your password.']})
    }

    return this;
  },

  onResetPasswordSuccess: function(response) {
    this.destroyCache()
      .unset('password')
      .unset('passwordResetData')
      .unset('is_recovering_password')
      .trigger('user:reset-password:success', response);

    return this;
  },

  onResetPasswordError: function(error) {
    error = error.responseJSON ? error.responseJSON.error : error;
    error = error.token || error.password;
    error = error ? error[0] : 'An error ocurred';
    this.trigger('user:reset-password:error', error);
    return this;
  },

  getDomain: function() {
    return this.has('email')
      ? this.get('email').split('@')[1]
      : '';
  },

  resetSignup: function() {
    this.clear().destroyCache().set({
      signup_step: 'request-signup'
    });

    return this;
  },

  respondWithAccounts: function(channel) {
    this.broadcast(channel, this.get('accounts'));
  },

  respondWithId: function(channel) {
    this.broadcast(channel, this.id);
  },

  changePassword: function(currentPassword, newPassword, confirmPassword) {
    var data = JSON.stringify({
      current_password: currentPassword,
      password1: newPassword,
      password2: confirmPassword
    });

    $.post(App.API_URL + '/users/me/change_password/', data)
      .done(_.bind(this.onChangePasswordSuccess, this))
      .fail(_.bind(this.onChangePasswordError, this));

    return this;
  },

  onChangePasswordSuccess: function(response) {
    this.set(response).saveCache();
    this.broadcast('user:change-password:success', response);

    return this;
  },

  onChangePasswordError: function(error) {
    error = error.responseJSON ? error.responseJSON.error : error;
    this.broadcast('user:change-password:error', error);

    return this;
  },

  closeAccount: function(currentPassword) {
    var data = JSON.stringify({
      current_password: currentPassword
    });

    $.post(App.API_URL + '/users/me/cancel/', data)
      .done(_.bind(this.onCloseAccountSuccess, this))
      .fail(_.bind(this.onCloseAccountError, this));

    return this;
  },

  onCloseAccountSuccess: function(response) {
    this.signout()

    this.trigger('user:cancel-account:success', response);

    return this;
  },

  onCloseAccountError: function(error) {
    error = error.responseJSON ? error.responseJSON.error : error;
    error = error.current_password
    error = error ? error[0] : 'An error ocurred';
    this.trigger('user:cancel-account:error', error);

    return this;
  }
});

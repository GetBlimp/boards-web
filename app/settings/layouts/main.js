var UserSettings = require('settings/views/user-settings'),
    AccountsSettings = require('settings/views/accounts-settings'),
    NotificationsSettings = require('settings/views/notifications-settings'),
    PasswordSettings = require('settings/views/password-settings'),
    AdvancedSettings = require('settings/views/advanced-settings');

module.exports = Z.Layout.extend({
  el: 'div.settings',

  keepEl: true,

  template: require('settings/templates/layout'),

  regions: {
    content: require('settings/regions/content')
  },

  subscriptions: {
    'settings:close': 'hide',
    'settings:user:open': 'openUserSettings',
    'settings:accounts:open': 'openAccountsSettings',
    'settings:password:open': 'openPasswordSettings',
    'settings:advanced:open': 'openAdvancedSettings',
    'settings:notifications:open': 'openNotificationsSettings'
  },

  events: {
    'shown.bs.modal #settings-modal': 'listenToAjax',
    'hidden.bs.modal #settings-modal': 'stopListeningToAjax',
    'click [data-action=showGeneral]': 'showUserSettings',
    'click [data-action=showAccounts]': 'showAccountsSettings',
    'click [data-action=showPassword]': 'showPasswordSettings',
    'click [data-action=showAdvanced]': 'showAdvancedSettings',
    'click [data-action=showNotifications]': 'showNotificationsSettings'
  },

  elements: {
    modal: 'div#settings-modal',
    alert: 'div.ui-modal-alert',
    generalBtn: '[data-action=showGeneral]',
    accountsBtn: '[data-action=showAccounts]',
    passwordBtn: '[data-action=showPassword]',
    advancedBtn: '[data-action=showAdvanced]',
    sectionBtns: 'div.settings-sections button',
    notificationsBtn: '[data-action=showNotifications]'
  },

  context: function() {
    return {
      hasTeamAccounts: App.Accounts.hasTeamAccounts()
    }
  },

  initialize: function() {
    _.bindAll(this, ['onAjaxSuccess', 'onAjaxError']);
  },

  hide: function() {
    this.getElement('modal').modal('hide');
    return this;
  },

  listenToAjax: function() {
    $(document).on('ajaxError.settings', this.onAjaxError);
    $(document).on('ajaxSuccess.settings', this.onAjaxSuccess);
  },

  stopListeningToAjax: function() {
    $(document).off('ajaxError.settings');
    $(document).off('ajaxSuccess.settings');
  },

  onAjaxSuccess: function() {
    var $alert = this.getElement('alert');

    $alert.text('Changes saved.').show();

    _.delay(function() {
      $alert.hide();
    }, 1500);
  },

  onAjaxError: function() {
    var $alert = this.getElement('alert');

    $alert.text('Something went wrong. Please try again.').show();

    _.delay(function() {
      $alert.hide();
    }, 1500);
  },

  openUserSettings: function() {
    this.showUserSettings();
    this.getElement('modal').modal('show');
    return this;
  },

  openAccountsSettings: function() {
    this.showAccountsSettings();
    this.getElement('modal').modal('show');
    return this;
  },

  openNotificationsSettings: function() {
    this.showNotificationsSettings();
    this.getElement('modal').modal('show');
    return this;
  },

  openPasswordSettings: function() {
    this.showPasswordSettings();
    this.getElement('modal').modal('show');
    return this;
  },

  openAdvancedSettings: function() {
    this.showAdvancedSettings();
    this.getElement('modal').modal('show');
    return this;
  },

  showUserSettings: function() {
    this.getElement('sectionBtns').removeClass('active');
    this.getElement('generalBtn').addClass('active');
    this.getRegion('content').setView(UserSettings).show();
    return this;
  },

  showAccountsSettings: function() {
    this.getElement('sectionBtns').removeClass('active');
    this.getElement('accountsBtn').addClass('active');
    this.getRegion('content').setView(AccountsSettings).show();
    return this;
  },

  showNotificationsSettings: function() {
    this.getElement('sectionBtns').removeClass('active');
    this.getElement('notificationsBtn').addClass('active');
    this.getRegion('content').setView(NotificationsSettings).show();
    return this;
  },

  showPasswordSettings: function() {
    this.getElement('sectionBtns').removeClass('active');
    this.getElement('passwordBtn').addClass('active');
    this.getRegion('content').setView(PasswordSettings).show();
    return this;
  },

  showAdvancedSettings: function() {
    this.getElement('sectionBtns').removeClass('active');
    this.getElement('advancedBtn').addClass('active');
    this.getRegion('content').setView(AdvancedSettings).show();
    return this;
  },

  onUnplug: function() {
    this.stopListeningToAjax();
  }
});

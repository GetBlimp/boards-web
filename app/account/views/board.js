module.exports = Zeppelin.ModelView.extend({
  tagName: 'li',

  className: function() {
    var className = 'board';
    if (this.model.isNew()) className += ' is-being-created';
    return className;
  },

  template: require('account/templates/board'),

  events: {
    'click a.board-link': 'onClick',
    'click [data-action=leave]': 'onClickLeave',
    'click [data-action=delete]': 'onClickDelete'
  },

  elements: {
    link: 'a.board-link',
    name: 'span.board-name',
    thumb: '.board-avatar'
  },

  bindings: {
    model: {
      'sync': {
        once: true,
        callback: 'onSync'
      },
      'selected': 'onSelected',
      'deselected': 'onDeselected',
      'change:name': 'onNameChange',
      'change:thumbnail_xs_path': 'onThumbnailChange'
    }
  },

  partials: {
    'span.board-thumbnail-partial': require('account/templates/board-preview')
  },

  context: function() {
    return _.extend({}, this.model.attributes, {
      url: this.model.getUrl(),
      isMine: this.model.isMine()
    });
  },

  updateName: function(name) {
    this.getElement('name').text(name);
    return this;
  },

  updateThumbnail: function(thumbnail) {
    this.renderPartial('span.board-thumbnail-partial', {
      color: this.model.get('color'),
      thumbnail_xs_path: thumbnail
    });

    return this;
  },

  delete: function() {
    var msg = 'Are you sure you want to delete this board and it\'s cards?';
    if (window.confirm(msg)) this.model.destroy();
    return this;
  },

  leave: function() {
    var msg = 'Are you sure you want to stop collaborating on this board?',
        self = this;

    if (window.confirm(msg)) {
      this.$el.addClass('is-being-created');
      this.model.leave().done(function() {
        self.$el.remove();
      });
    }

    return this;
  },

  onSync: function() {
    this.$el.removeClass('is-being-created');
    this.getElement('link').attr('href', this.model.get('html_url'));
  },

  onClick: function(event) {
    if (!event.metaKey) {
      event.preventDefault();

      if (!this.model.isNew()) {
        if (this.model.get('is_selected')) this.broadcast('cardDetail:closed');
        this.model.select();
        this.broadcast('board:clicked', this.model);
      }
    }
  },

  onSelected: function() {
    this.$el.addClass('is-selected');
  },

  onDeselected: function() {
    this.$el.removeClass('is-selected');
  },

  onNameChange: function(board, name) {
    this.updateName(name);
  },

  onThumbnailChange: function(board, thumbnail) {
    this.updateThumbnail(thumbnail);
  },

  onClickDelete: function(event) {
    event.preventDefault();
    event.stopPropagation();
    this.delete();
  },

  onClickLeave: function(event) {
    event.preventDefault();
    event.stopPropagation();
    this.leave();
  }
});


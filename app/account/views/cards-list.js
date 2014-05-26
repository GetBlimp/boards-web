module.exports = Zeppelin.CollectionView.extend({
  tagName: 'ol',

  className: 'cards-list list-unstyled clearfix',

  subscriptions: {
    'cardsList:layout': 'triggerLayout'
  },

  addMethod: 'prepend',

  wall: null,

  layoutTimer: null,

  itemView: function(model) {
    return require('account/views/' + model.get('type'));
  },

  collection: function() {
    return App.Cards;
  },

  initialize: function() {
    _.bindAll(this, ['layout']);
  },

  triggerLayout: function() {
    this.layoutTimer = _.delay(this.layout, 1);
  },

  layout: function() {
    if (this.collection.isEmpty()) return this;
    if (!this.wall) this.wall = new freewall(this.$list);

    this.wall.reset({
      delay: 0,
      cellW: 222,
      cellH: 222,
      gutterX: 15,
      gutterY: 15,
      animate: false,
      fixSize: 0,
      selector: 'li.card',
      onResize: _.bind(function() {
        this.wall.fitWidth();
      }, this)
    });

    this.wall.fitWidth();

    return this;
  },

  onRenderItems: function() {
    this.triggerLayout();
  },

  onPrependItem: function() {
    if (!this.isFirstCollectionRender()) this.triggerLayout();
  },

  onUnplug: function() {
    clearTimeout(this.layoutTimer);
  }
});


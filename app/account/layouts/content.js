var BoardDetail = require('account/views/board-detail'),
    CreateComment = require('account/views/create-comment'),
    CardDetailInfo = require('account/views/card-detail-info'),
    CardDetailActions = require('account/views/card-detail-actions');

module.exports = Z.Layout.extend({
  el: 'div.content',

  regions: {
    cardsList: require('account/regions/cards-list'),
    cardDetail: require('account/regions/card-detail'),
    cardComments: require('account/regions/card-comments'),
    createComment: require('account/regions/create-comment'),
    contentHeader: require('account/regions/content-header'),
    cardDetailInfo: require('account/regions/card-detail-info'),
  },

  events: {
    'click [data-action=createFirstFile]': 'onCreateFirstFileClick',
    'click [data-action=createFirstNote]': 'onCreateFirstNoteClick'
  },


  elements: {
    cardsWrapper: 'div.cards-wrapper'
  },

  setHeight: function() {
    this.$el.height($(document).height() - 52);
    return this;
  },

  toggleLoadingCardsState: function() {
    this.getElement('cardsWrapper').toggleClass('is-loading');
    return this;
  },

  toggleEmptyCardsState: function(hasCards) {
    this.getElement('cardsWrapper').removeClass('is-loading');
    this.getElement('cardsWrapper').toggleClass('has-no-cards', hasCards);
    return this;
  },

  showBoardDetail: function(board) {
    this.getRegion('contentHeader').setView(BoardDetail, {model: board}).show();
  },

  onCreateFirstFileClick: function() {
    this.broadcast('fileUploader:trigger');
  },

  onCreateFirstNoteClick: function() {
    $('#createNoteModal').modal('show');
  },

  showCards: function() {
    this.getRegion('cardDetail').close();
    this.getRegion('cardComments').close();
    this.getRegion('createComment').close();
    this.getRegion('cardDetailInfo').close();

    if (!this.getRegion('cardsList').isShown()) {
      this.getRegion('cardsList').show();
    } else {
      this.getRegion('cardsList').view.$el.show();
    }
  },

  showCardDetail: function(card, board) {
    if (this.getRegion('cardsList').isShown()) {
      this.getRegion('cardsList').view.$el.hide();
    }

    this.getRegion('contentHeader').setView(CardDetailActions, {
      model: card,
      boardUrl: board.getUrl(),
      boardName: board.get('name')
    }).show();


    this.getRegion('cardDetail').showDetail(card);
    this.getRegion('createComment').setView(CreateComment, {cardId: card.id}).show();
    this.getRegion('cardDetailInfo').setView(CardDetailInfo, {model: card}).show();
  }
});

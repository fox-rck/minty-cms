var uuid = require("node-uuid");
var assert = require("assert");
var _ = require("underscore")._;
require("date-utils");

var Article = function(args){

  //can't have an article without a title and body
  assert.ok(args.title && args.body && args.slug, "Need a slug, title and a body");

  //we also need an author
  assert.ok(args.author, "Need an author here bud");

  this.title = args.title;
  this.summary = null;
  this.image = null;
  this.body = args.body;
  this.slug = args.slug;
  this.createdAt = args.createdAt || new Date();
  this.updatedAt = new Date();
  this.uuid = args.uuid || uuid.v1();
  this.status = args.status || "draft";
  this.allowComments = args.allowComments || false;
  this.postType = args.postType || "post";
  this.publishedAt = args.publishedAt || null;
  this.author = args.author || {};
  this.tags = args.tags || [];



  this.setPublishedDates = function(){
    if(this.publishedAt){
      this.publishSlug = this.publishedAt.toYMD();
      this.prettyDate = this.publishedAt.toFormat("DDDD MMMM, YYYY");
    }else{
      this.publishSlug = null;
      this.prettyDate = null;
    }
  };
  this.setPublishedDates();

  this.updateTo = function(changes){
    _.extend(this,changes);
    return this;
  };

  return this;
};


module.exports = Article;
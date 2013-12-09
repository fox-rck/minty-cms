var uuid = require("node-uuid");
var assert = require("assert");
var _ = require("underscore")._;
require("date-utils");
var Author = require("./author");

var Article = function(args){

  //can't have an article without a title and body
  assert.ok(args.title && args.body && args.slug, "Need a slug, title and a body");

  //we also need an author
  assert.ok(args.author, "Need an author");

  this.title = args.title;
  this.summary = args.summary;
  this.image = args.image;
  this.body = args.body;
  this.slug = args.slug;
  this.createdAt = args.createdAt || new Date();
  this.updatedAt = new Date();
  this.uuid = args.uuid || uuid.v1();
  this.status = args.status || "draft";
  this.allowComments = args.allowComments || false;
  this.postType = args.postType || "post";
  this.publishedAt = args.publishedAt || null;
  this.tags = args.tags || [];

  if(args.author){
    this.author = new Author(args.author);
  }
  this.setPublishedDates = function(){
    if(this.publishedAt){
      this.publishSlug = this.publishedAt.toYMD();
      this.prettyDate = this.publishedAt.toFormat("DDDD MMMM, YYYY");
    }else{
      this.publishSlug = null;
      this.prettyDate = null;
    }
  };

  this.isPublished = function(){
    return this.status === "published" && this.publishedAt && this.publishedAt <= new Date();
  };
  this.wordpressUrl = function(){
    if(this.publishedAt){
      var dateFragment = this.publishedAt.toFormat("/YYYY/mm/dd/");
      return dateFragment + this.slug;
    }else{
      return null;
    }

  };

  this.setPublishedDates();

  this.publish = function(){
    this.status = "published";
    this.publishedAt = new Date();
  };

  this.unpublish = function(){
    this.status = "draft";
    this.publishedAt = null;
  };
  this.updateTo = function(changes){
    _.extend(this,changes);
    return this;
  };

  return this;
};


module.exports = Article;

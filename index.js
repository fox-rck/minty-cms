var assert = require("assert");
var _ = require("underscore")._;
var async = require("async");

var Publisher = require("./lib/publisher");
var Emitter = require("events").EventEmitter;
var util = require("util");
var Datastore = require("nedb");

//initializer
var Minty = function(){
  Emitter.call(this);
  return this;
};

//inherit from Emitter
util.inherits(Minty,Emitter);

//local, private instance of the DB
var db = {};

Minty.prototype.init =function(conf,next){
  var self = this;
  conf = conf || {};

  //article storage
  if(conf.db){
    assert.ok(conf.db,"Need a db setting");
    db.articles = new Datastore({ filename: conf.db, autoload: true });
  }else{
    //in-memory only
    db.articles = new Datastore();
  }

  //need to be sure to index slug
  db.articles.ensureIndex({fieldName : "slug", unique : true}, function(err){
    self.publisher = new Publisher(db);
    next(err,self);
  });

};


Minty.prototype.getArticle = function(args, next){
  this.publisher.getArticle(args,function(err, dog){
    next(err,dog);
  });
};

Minty.prototype.deleteArticle = function(criteria, next){
  this.publisher.deleteArticle(criteria,next);
};


Minty.prototype.saveArticle = function(args, next){

  args = args || {};
  //make sure we have a slug
  args.slug = args.slug || sluggify(args.title);

  this.publisher.saveArticle(args,next);

};

Minty.prototype.tagArticle = function(slug, tags, next){
  var self = this;
  //we can save a few things on publish - not everything
  db.articles.update({slug : slug}, {$set : {tags : tags}}, {}, function(){
    //wish it returned the updated article but... oh well...
    self.getArticle({slug : slug}, next);
  });
};

Minty.prototype.publishArticle = function(slug, next){
  var self = this;
  //we can save a few things on publish - not everything
  db.articles.update({slug : slug}, {$set : {status : "published", publishedAt : new Date()}}, {}, function(){
    //wish it returned the updated article but... oh well...
    self.getArticle({slug : slug}, next);
  });
};

Minty.prototype.unpublishArticle = function(slug, next){
  var self = this;
  //we can save a few things on publish - not everything
  db.articles.update({slug : slug}, {$set : {status : "draft", publishedAt : null}}, {}, function(){
    //wish it returned the updated article but... oh well...
    self.getArticle({slug : slug}, next);
  });
};

Minty.prototype.takeArticleOffline = function(slug, next){
  var self = this;
  //we can save a few things on publish - not everything
  db.articles.update({slug : slug}, {$set : {status : "offline", publishedAt : null}}, {}, function(){
    //wish it returned the updated article but... oh well...
    self.getArticle({slug : slug}, next);
  });
};

Minty.prototype.archive = function(criteria, next){

  criteria = criteria || {};
  criteria.status = criteria.status || "published";
  var limit = 200;

  if(criteria.limit){
    limit = criteria.limit;
    //now remove it as it will mess with our query
    delete criteria.limit;
  }

  //nedb doesn't support sorts so... pull everything in and sort it with Underscore
  //which is OK since it's all in-memory and we're caching physical pages so
  //this will only be called once every great while
  criteria.publishedAt = criteria.publishedAt || {$lte : new Date()};

  //hand off to the publisher bits
  this.publisher.allArticles(criteria,next);
};

Minty.prototype.recentArticles = function(limit, next){

  //pull the archive...
  this.archive({limit : limit}, next);

};

Minty.prototype.deleteAllArticles = function(next){
  this.deleteArticle({}, next);
};

Minty.prototype.tagList = function(next){
  this.archive({},function(err, articles){
    var smushed = _.map(articles, function(article){
      return _.flatten(article.tags);
    });
    var uniqued = _.uniq(smushed);
    next(null,uniqued);
  });

};

//utility function for creating slugs
var sluggify = function(str){
  var from  = "ąàáäâãåæćęèéëêìíïîłńòóöôõøśùúüûñçżź",
      to    = "aaaaaaaaceeeeeiiiilnoooooosuuuunczz",
      regex = new RegExp('[' + from.replace(/([.*+?^=!:${}()|[\]\/\\])/g, '\\$1') + ']', 'g');
  if (str == null) return '';
  str = String(str).toLowerCase().replace(regex, function(c) {
    return to.charAt(from.indexOf(c)) || '-';
  });
  return str.replace(/[^\w\s-]/g, '').replace(/([A-Z])/g, '-$1').replace(/[-_\s]+/g, '-').toLowerCase();
};

module.exports = new Minty();

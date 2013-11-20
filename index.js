var assert = require("assert");
var _ = require("underscore")._;
var async = require("async");
var Article = require("./models/article");
var Author = require("./models/author");
var Edition = require("./models/edition");
var Emitter = require("events").EventEmitter;
var util = require("util");
var Datastore = require('nedb');
require('date-utils');

var db = {};

//initializer
var Minty = function(){
  Emitter.call(this);
  return this;
};

util.inherits(Minty,Emitter);

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

Minty.prototype.init = function(args, next){
  var self = this;
  //do we have a db file to save to?
  if(args.db){
    //we're only using a single data store here for articles
    //if we need to use a separate one for whatever reason, we can
    //nedb only supports a single document hierarchy
    db.articles = new Datastore({ filename: args.db, autoload: true });
    db.articles.loadDatabase(function(err){
      //set a unique on the slug
      db.articles.ensureIndex({fieldName : "slug", unique : true}, function(err){
        next(err, self);
      });
    });
  }else{
    db.articles = new Datastore();
    next(null,self);
  }
};

Minty.prototype.getArticle = function(args, next){
  assert(args.id || args.slug, "Need an id or a slug yo");
  db.articles.findOne(args, function(err,found){
    if(found){
      next(null,new Article(found));
    }else{
      next(err,null);
    }
  });
};

var createDocument = function(doc, next){
  var newDoc = new Article(doc);
  var edition = new Edition();
  db.articles.insert(newDoc, function(err,inserted){
    if(err){
      edition.setInvalid(err);
      next(err,edition);
    }else{
      edition.article = inserted;
      edition.success = true;
      edition.message = "Article updated";
      next(null,edition);
    }
  });
};

var updateDocument = function(doc, changes, next){
  var changed = new Article(doc).updateTo(changes);
  var edition = new Edition({article : changed});
  db.articles.update({slug : args.slug}, changed, {}, function(err){
    if(err){
      edition.setInvalid(err);
      next(err,edition);
    }else{
      edition.success = true;
      edition.message = "Article saved";
      next(null,edition);
    }
  });
};

Minty.prototype.deleteArticle =function(criteria, next){
  db.articles.remove(criteria, {multi : true}, next);
};

Minty.prototype.saveArticle = function(args, next){
  assert.ok(args.title && args.body, "Need a title and a body yo");

  args = args || {};
  args.slug = args.slug || sluggify(args.title);

  //do we have an article?
  db.articles.findOne({slug : args.slug}, function(err,found){
    if(found){
      updateDocument(found,args,next);
    }else{
      createDocument(args,next);
    }
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
  //nedb doesn't support sorts so... pull everything in and sort it with Underscore :/
  criteria.publishedAt = criteria.publishedAt || {$lte : new Date()};

  db.articles.find(criteria, function(err, docs){
    var out = [];

    //push into an Article
    _.each(docs, function(doc){out.push(new Article(doc));});

    //now sort the output by published date...
    out.sort(function(a, b){
      return a.publishedAt < b.publishedAt ? 1 : -1;
    });

    //clip off based on limit
    var limited = _.first(out, limit);

    next(err,limited);
  });
};

Minty.prototype.recentArticles = function(limit, next){

  //pull the archive...
  this.archive({limit : limit}, next);

};

Minty.prototype.deleteAllArticles = function(next){
  this.deleteArticle({}, next);
};


module.exports = new Minty();

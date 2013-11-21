var assert = require("assert");
var _ = require("underscore")._;
var async = require("async");
var Article = require("./models/article");
var Author = require("./models/author");
var Edition = require("./models/edition");
var Emitter = require("events").EventEmitter;
var util = require("util");
var Datastore = require("nedb");
var db = {};

//initializer
var Minty = function(){
  Emitter.call(this);
  return this;
};

//inherit from Emitter
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

Minty.prototype.init =function(conf,next){
  var self = this;
  assert.ok(conf.db,"Need a db setting");

  //article storage
  db.articles = new Datastore({ filename: conf.db, autoload: true });

  //need to be sure to index slug
  db.articles.ensureIndex({fieldName : "slug", unique : true}, function(err){
    next(err,self);
  });
};


Minty.prototype.getArticle = function(args, next){
  assert(args.id || args.slug, "Need an id or a slug");
  db.articles.findOne(args, function(err,found){
    if(err){
      next(err,null);
    }else{
      next(null, new Article(found));
    }
  });
};

Minty.prototype.deleteArticle = function(criteria, next){
  db.articles.remove(criteria, next);
};


var createArticle = function(article, next){
  var newArticle = new Article(article);
  db.articles.insert(newArticle,function(err,newDoc){
    if(err){
      var edition = new Edition({article : article});
      edition.setInvalid(err);
      next(err,edition);
    }else{
      var edition = new Edition({article : newDoc, success : true, message : "Article created"});
      next(null,edition);
    }

  });
};

var updateArticle = function(article,changes, next){
  var changed = new Article(article).updateTo(changes);
  db.articles.update({slug : changed.slug}, changed, {}, function(err){
    if(err){
      var edition = new Edition({article : article});
      edition.setInvalid(err);
      next(err,edition)
    }else{
      var edition = new Edition({article : changed, success : true, message : "Article updated"});
      next(null,edition);
    }
  });
};

Minty.prototype.saveArticle = function(args, next){
  assert.ok(args.title && args.body, "Need a title and a body yo");

  args = args || {};
  args.slug = args.slug || sluggify(args.title);

  //do we have an article?
  db.articles.findOne({slug : args.slug}, function(err,found){
    if(found){
      updateArticle(found,args, next);
    }else{
      createArticle(args, next);
    }
  });

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

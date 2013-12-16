var assert = require("assert");
var _ = require("underscore")._;
var Article = require("../models/article");
var Author = require("../models/author");
var Edition = require("../models/edition");
var Emitter = require("events").EventEmitter;
var util = require("util");


var Publisher = function (db) {
  //make sure a db is passed in
  assert.ok(db, "Need a datastore to work with");

  Emitter.call(this);
  var self = this;

  self.updateArticle = function(edition){
    //apply the changes
    edition.article.updateTo(edition.changes);

    db.articles.update({slug : edition.article.slug}, edition.article, {}, function(err){
      if(err){
        edition.setInvalid(err);
        self.emit("invalid", edition);
      }else{
        edition.setSuccessful("Article updated");
        self.emit("updated", edition);
      }
    });
  };

  self.createArticle = function(edition){
    var newArticle = new Article(edition.changes);
    db.articles.insert(newArticle,function(err,newDoc){
      if(err){
        edition.setInvalid(err);
        self.emit("invalid", edition);
      }else{
        edition.article = new Article(newDoc);
        edition.setSuccessful("Article created");
        self.emit("created", edition);
      }
    });
  };

  self.deleteArticle = function(criteria, next){
    db.articles.remove(criteria, next);
  };

  self.getArticle = function(criteria, next){
    assert(criteria.id || criteria.slug, "Need an id or a slug");
    db.articles.findOne(criteria, function(err,found){
      if(err){
        next(err,null);
      }else{
        var out = found ? new Article(found) : null;
        next(null, out);
      }
    });
  };

  self.allArticles = function(criteria, next){

    db.articles.find(criteria, function(err, docs){
      var out = [];

      //push into an Article
      _.each(docs, function(doc){out.push(new Article(doc));});

      //now sort the output by published date...
      out.sort(function(a, b){
        return a.publishedAt < b.publishedAt ? 1 : -1;
      });

      next(err,out);
    });
  };

  self.saveArticle = function(article, next){
    //there's workflow here, so hand it off to the save event-chain
    var edition = new Edition({changes : article});
    //save the callback here ...
    edition.continueWith = next;
    self.emit("save-requested", edition);
  };


  return self;
};

util.inherits(Publisher, Emitter);
module.exports = Publisher;


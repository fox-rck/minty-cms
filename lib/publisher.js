var assert = require("assert");
var _ = require("underscore")._;
var async = require("async");
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
  var continueWith = null;

  var validateArticle = function(edition){
    //need an author, title, and body
    if(edition.changes.author && edition.changes.title && edition.changes.body){
      self.emit("validated", edition);
    }else{
      edition.setInvalid("Need an author, title, and body", edition);
      self.emit("invalid", edition);
    }
  };

  var checkExistence = function(edition){

    self.getArticle({slug : edition.changes.slug}, function(err,found){
      if(found){
        //move the passed in bits to the changes to be made
        edition.article = new Article(found);
        self.emit("exists", edition);
      }else{
        self.emit("doesnt-exist", edition);
      }
    });
  };

  var updateArticle = function(edition){
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

  var createArticle = function(edition){
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
        var out = null;
        if(found){
          out = new Article(found);
        }
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
    //save continuation to use when events are done
    continueWith = next;
    //there's workflow here, so hand it off to the save event-chain
    var edition = new Edition({changes : article});
    self.emit("save-requested", edition);
  };

  var saveOk = function(edition){
    //just to be sure
    edition.success = true;
    if(continueWith){
      continueWith(null,edition);
    }
  };

  var saveNotOk = function(edition){
    //just to be sure
    edition.success = false;
    if(continueWith){
      continueWith(edition.message,edition);
    }
  };

  //the save event chain
  self.on("save-requested", validateArticle);
  self.on("validated", checkExistence);
  self.on("exists", updateArticle);
  self.on("doesnt-exist", createArticle);
  self.on("created", saveOk);
  self.on("updated", saveOk);

  self.on("invalid", saveNotOk);

  return self;
};

util.inherits(Publisher, Emitter);
module.exports = Publisher;


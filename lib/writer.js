var assert = require("assert");
var _ = require("underscore")._;

var Edition = require("../models/edition");
var Emitter = require("events").EventEmitter;
var Tagger = require("./tagger");

var util = require("util");
var uuid = require('node-uuid');

var Writer = function (schema) {

  Emitter.call(this);
  var self = this;
  var continueWith = null;
  var tagger = new Tagger(schema);
  //check for required bits (author, title, body)
  var validateEdition = function(edition){

    //we have an article, so build a proper one
    var article = edition.article;
    var author = edition.author;

    //make sure we have the info we need
    if(!(article.title && article.body)){
      edition.setInvalid("Need a title and a body for the article");
      self.emit("invalid",edition);
    }else{
      //we're good!
      self.emit("validated", edition);
    }

  };

  var setTags = function(edition){
    tagger.setTags(edition.article, edition.tags,function(err,result){
      if(err){
        edition.setInvalid(err);
        self.emit("invalid", edition);
      }else{
        self.emit("article-tagged", edition);
      }
    });
  };


  //create a slug if doesn't exist
  var checkForSlug = function(edition){
    var article = edition.article;
    article.slug = article.slug || edition.createSlugFromTitle();
    self.emit("slug-checked",edition);
  };

  var assignAuthor = function(edition){
    schema.Author.findOrCreate(edition.author)
        .success(function(author){
          edition.article.setAuthor(author)
              .success(function(){
                self.emit("author-assigned", edition);
              })
              .error(function(){
                edition.setInvalid(err);
                self.emit("invalid", edition)
              });
        })
        .error(function(err){
          edition.setInvalid(err);
          self.emit("invalid", edition);
        })
  };

  var sendDraftToDB = function(edition){
    //guarantee this is draft status
    edition.article.status = "draft";
    //create a unique ID - v4 is random, v1 is clock-based
    edition.article.uuid = uuid.v1();
    schema.Article.create(edition.article)
        .success(function(draftArticle){
          edition.article = draftArticle;
          self.emit("article-saved",edition);
        })
        .error(function(err){
          edition.setInvalid(err);
          self.emit("invalid", edition);
        });
  };

  //the happy endpoint of the process pipe
  var draftOk = function(edition){
    edition.success = true;
    edition.message = "Edit made";
    self.emit("draft-saved",edition);
    if(continueWith){
      continueWith(null,edition);
    }
  };

  //something didn't work out - the final method called
  var draftNotOk = function(edition){
    edition.success = false;
    self.emit("draft-not-saved",edition);
    if(continueWith){
      continueWith(edition.message,edition);
    }
  };

  //the one visible
  self.saveDraft = function(args, next){
    assert.ok(args.article && args.author, "Can't save something without an article and author");

    //set the article
    var edition = new Edition(args);
    continueWith = next;
    self.emit("draft-received", edition);
  };

  //process
  self.on("draft-received", validateEdition);
  self.on("validated",checkForSlug);
  self.on("slug-checked",sendDraftToDB);
  self.on("article-saved",assignAuthor);
  self.on("author-assigned",setTags);
  self.on("article-tagged",draftOk);

  //uh oh
  self.on("invalid",draftNotOk);

  return self;
};

util.inherits(Writer, Emitter);
module.exports = Writer;
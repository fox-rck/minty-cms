var Emitter = require("events").EventEmitter;
var util = require("util");
var Edition = require("../models/edition");
var assert = require("assert");
var _ = require("underscore")._;
var async = require("async");
var Tagger = require("./tagger");

var Editor = function (schema) {

  Emitter.call(this);
  var self = this;
  var continueWith = null;
  var tagger = new Tagger(schema);

  var validateChanges = function(edition){
    //do we have any changes?
    if(!edition.changes){
      edition.setInvalid("No changes to be made");
      self.emit("invalid",edition);
    }else{

      //do we have an id?
      if(!(edition.changes.id || edition.changes.slug)){
        edition.setInvalid("Be sure to send in an ID - don't know what to change otherwise");
        self.emit("invalid",edition);
      }else{
        //if there's a slug, make sure it's valid
        if(edition.changes.slug){
          edition.changes.slug = edition.sluggify(edition.changes.slug);
        }

        //we only take "draft", "published", "offline" for status
        if(edition.changes.status){
          var status = edition.changes.status;
          if(!(status === "draft" || status === "published" || status === "offline")){
            //remove status - this will remove it from the update
            delete edition.changes.status;
          }
        }
        self.emit("changes-validated", edition);
      }
    }

  };

  var loadArticle = function(edition){

    var criteria = edition.changes.id ? {id : edition.changes.id} : {slug : edition.changes.slug};
    schema.Article.find({where : criteria})
        .success(function(article){
          edition.article = article;
          self.emit("article-loaded",edition)
        })
        .error(function(err){
          edition.setInvalid("This article doesn't exist");
          self.emit('invalid',edition);
        });
  };

  var snapVersion = function(edition){
    var article = edition.article;
    var version = {
      title : article.title,
      slug : article.slug,
      status : article.status,
      summary : article.summary,
      image : article.image,
      body : article.body,
      snappedAt : new Date(),
      articleId : article.id
    };
    schema.Version.create(version)
        .success(function(version){
          self.emit("version-created",edition);
        })
        .error(function(err){
          edition.setInvalid(err);
          self.emit("invalid",edition);
        });
  };

  var setTags = function(edition){
    if(edition.changes.tags){

      tagger.setTags(edition.article, edition.tags,function(err,result){
        if(err){
          edition.setInvalid(err);
          self.emit("invalid", edition);
        }else{
          self.emit("article-tagged", edition);
        }
      });
    }else{
      self.emit("article-tagged", edition);
    }

  };

  var saveArticle = function(edition){
    //pull the article
    edition.article.updateAttributes(edition.changes)
          .success(function(updatedArticle){
            edition.article = updatedArticle;
            self.emit("article-updated",edition);
          })
          .error(function(err){
            edition.setInvalid(err);
            self.emit("invalid",edition);
          });

  };

  var editOk = function(edition){
    edition.success = true;
    edition.message = "Edit made";
    self.emit("article-saved",edition);
    if(continueWith){
      continueWith(null,edition);
    }
  };

  //something didn't work out - the final method called
  var editNotOk = function(edition){
    edition.success = false;
    self.emit("article-not-saved",edition);
    if(continueWith){
      continueWith(edition.message,edition);
    }
  };

  self.editArticle = function(args, next){
    //we're looking for an id as well as some changes...
    continueWith = next;
    var edition = new Edition({changes : args});
    self.emit("article-edit-received", edition);
  };

  self.deleteArticle = function(id, next){
    //schema.Article.destroy({id : id}) is broken in Sequelize :/

    schema.Article.find(id)
        .success(function(article){
          article.destroy()
              .success(function(){
                next(null,{success:true});
              })
              .error(function(err){
                next(err, {success : false});
              });
        })
        .error(function(err){
          next(err, {success : false});
        });

  };

  self.getArticle = function(args, next){

    schema.Article.find({where : args, include : [schema.Author, schema.Tag]})
        .success(function(article){
          next(null,article);
        })
        .error(function(err){
          next(err,null);
        });
  };


  //happy path
  self.on("article-edit-received", validateChanges);
  self.on('changes-validated', loadArticle);
  self.on("article-loaded",setTags);
  self.on("article-tagged", saveArticle);
  self.on("article-updated", snapVersion);
  self.on("version-created",editOk);

  //uh oh
  self.on("invalid",editNotOk);

  return self;
};

util.inherits(Editor, Emitter);
module.exports = Editor;
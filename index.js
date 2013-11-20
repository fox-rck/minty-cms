var assert = require("assert");
var _ = require("underscore")._;
var async = require("async");
var Writer = require("./lib/writer");
var Editor = require("./lib/editor");
var Schema = require("./models/schema");

var schema = null;


//initializer
var Minty = function(args){

  args = args || {};
  var defaultDb = "./data/minty.db";
  var conn = args.db || defaultDb;

  //load up the schema
  schema = new Schema(conn);

  this.writer = new Writer(schema);
  this.editor = new Editor(schema);

  //BAM outta here
  return this;
};


Minty.prototype.dropAndInstall = function(next) {
  schema.sync(next);
};

Minty.prototype.saveDraft = function(args, next){
  this.writer.saveDraft(args,next);
};

Minty.prototype.publishArticle = function(slug, next){
  //we can save a few things on publish - not everything
  var changes = {
    slug : slug,
    publishedAt : new Date(),
    status : "published"
  };

  this.editor.editArticle(changes, next);
};

Minty.prototype.unpublishArticle = function(slug, next){
  this.editor.editArticle({slug : slug, status : "draft"}, next);
};

Minty.prototype.takeArticleOffline = function(slug, next){
  this.editor.editArticle({slug : slug, status : "offline"}, next);
};

Minty.prototype.deleteAllPosts = function(next){
  schema.db.query("DELETE FROM posts; DELETE FROM poststags; DELETE FROM tags; DELETE FROM versions;")
      .success(function(res){
        next(null,res)
      })
      .error(function(err){
        next(err,null);
      });
};

//recent posts
Minty.prototype.recentPosts = function(criteria, next){
  criteria = criteria || {};
  criterial.limit = criteria.limit || 10;
  this.archive(criteria, next);
};

//everything
Minty.prototype.archive = function(criteria, next){

  criteria = criteria || {};
  criteria.status = criteria.status || "published";

  //default to published sort
  criteria.order = criteria.order || "publishedAt DESC"

  schema.Post.all(criteria)
      .success(function(posts){
        next(null,posts);
      })
      .error(function(err){
        next(err,null)
      });
};


Minty.prototype.getArticle = function(args, next){
  assert(args.id || args.slug, "Need an id or a slug yo");
  this.editor.getPost(args,next);
};

module.exports = Minty;

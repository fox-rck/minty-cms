var async = require("async");
var assert = require("assert");
var _ = require("underscore")._;

var Tagger = function(schema){

  var self = this;
  self.schema = schema;

  var deleteTags = function(article, next){
    article.setTags([])
        .success(function(){
          next(null);
        })
        .error(function(err){
          next(err)
        })
  };

  var dbTags = [];

  var findOrCreateTag = function(tag, next){
    //create a tag if it doesn't exist
    schema.Tag.findOrCreate({name : tag}).success(function(found){
      dbTags.push(found);
      next(null,found);
    });
  };

  var associateTags = function(article, tags, next){
    //this feels gross - but it really is helpful...
    async.each(tags, findOrCreateTag, function(err){
      article.setTags(dbTags)
          .success(function(){
            next(null,article);
          })
          .error(function(err){
            next(err,null);
          });
    });
  };


  self.setTags = function(article, tags, next){
    deleteTags(article, function(err,result){
      assert.ok(err === null, err);
      associateTags(article, tags, next);
    });
  };

  return self;
};


module.exports = Tagger;






var assert = require("assert");
var _ = require("underscore")._;

var Publisher = require("./lib/publisher");
var Validator = require("./lib/validator");
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

//local, private variables
var db = {}, publisher, validator;



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

  publisher = new Publisher(db);
  validator = new Validator(db);

  //set up the event chain
  wireEvents();

  //need to be sure to index slug
  db.articles.ensureIndex({fieldName : "slug", unique : true}, function(err){
    next(err,self);
  });

};

//the save process
var wireEvents = function(){
  publisher.on("save-requested", validator.checkRequired);
  validator.on("validated", validator.checkExistence);
  validator.on("exists", publisher.updateArticle);
  validator.on("doesnt-exist", publisher.createArticle);

  //happy path
  publisher.on("created", saveOk);
  publisher.on("updated", saveOk);

  //sad path
  publisher.on("invalid", saveNotOk);
  validator.on("invalid", saveNotOk);
};



Minty.prototype.getArticle = function(args, next){
  publisher.getArticle(args,function(err, dog){
    next(err,dog);
  });
};

Minty.prototype.deleteArticle = function(criteria, next){
  publisher.deleteArticle(criteria,next);
};


Minty.prototype.saveArticle = function(args, next){
  var self = this;
  args = args || {};
  //make sure we have a slug
  args.slug = args.slug || sluggify(args.title);

  publisher.saveArticle(args,function(err,edition){
    if(err){
      self.emit("article-error",err);
    }else{
      self.emit("article-saved",edition);
    }
    next(err,edition);
  });
};

var saveOk = function(edition){
  //just to be sure
  edition.success = true;
  if(edition.continueWith){
    edition.continueWith(null,edition);
  }
};

var saveNotOk = function(edition){
  //just to be sure
  edition.success = false;
  if(edition.continueWith){
    edition.continueWith(edition.message,edition);
  }
};



Minty.prototype.tagArticle = function(slug, tags, next){
  var self = this;
  this.getArticle({slug : slug}, function(err,article){
    article.tags = tags;
    publisher.saveArticle(article,function(err,edition){
      if(err){
        self.emit("article-error",err);
      }else{
        self.emit("article-tagged",edition);
      }
      next(err,edition);
    });
  });
};

Minty.prototype.publishArticle = function(slug, next){
  var self = this;
  this.getArticle({slug : slug}, function(err,article){
    article.status = "published";
    article.publishedAt = new Date();
    publisher.saveArticle(article,function(err,edition){
      if(err){
        self.emit("article-error",err);
      }else{
        self.emit("article-published",edition);
      }
      next(err,edition);
    });
  });
};

Minty.prototype.unpublishArticle = function(slug, next){
  var self = this;
  this.getArticle({slug : slug}, function(err,article){
    article.status = "draft";
    article.publishedAt = null;
    publisher.saveArticle(article,function(err,edition){
      if(err){
        self.emit("article-error",err);
      }else{
        self.emit("article-unpublished",edition);
      }
      next(err,edition);
    });
  });
};

Minty.prototype.takeArticleOffline = function(slug, next){
  var self = this;
  this.getArticle({slug : slug}, function(err,article){
    article.status = "offline";
    article.publishedAt = null;
    publisher.saveArticle(article,function(err,edition){
      if(err){
        self.emit("article-error",err);
      }else{
        self.emit("article-taken-offline",edition);
      }
      next(err,edition);
    });
  })
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
  publisher.allArticles(criteria,next);
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

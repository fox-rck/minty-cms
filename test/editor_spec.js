var should = require("should");
var Editor = require("../lib/editor");
var assert = require("assert");
var Schema = require("../models/schema");
var Writer = require("../lib/writer");

var testAuthor = {name : "Testy test", email : "test@test.com"};

describe("Editing", function(){
  var editor = {};
  var writer = {};
  before(function(done){
    var schema = new Schema({db : "./test/test.db"});
    editor = new Editor(schema);
    writer = new Writer(schema);
    schema.sync(function(){
      done();
    });
  });


  describe('creating a valid article with no tags', function(){
    var edition = {};
    before(function(done){
      var article = {title : "Something Nice 1", body : "A body bod"};
      //load up a draft
      writer.saveDraft({article : article, author : testAuthor}, function(err,result){
        assert.ok(err === null,err);
        edition = result;
        done();
      });
    });

    it('is successful', function(){
      edition.success.should.equal(true);
    });
    it("creates an article", function(){
      edition.article.should.be.defined;
    });
    it("sets the title, body and slug", function(){
      edition.article.title.should.equal("Something Nice 1");
      edition.article.body.should.equal("A body bod");
      edition.article.slug.should.equal("something-nice-1");
    });
    it("sets the status to DRAFT", function(){
      edition.article.status.should.equal("draft");
    });
    it('does NOT create a version', function(done){
      edition.article.getVersions().success(function(versions){
        versions.length.should.equal(0);
        done();
      });
    });
  });



  describe("editing a post title", function(){
    var edition = {};
    before(function(done){
      var article = {title : "Something Nice 2", body : "A body bod"};
      writer.saveDraft({article : article, author : testAuthor}, function(err,result){
        assert.ok(err === null,err);
        //now go and change it
        editor.editArticle({id : result.article.id, title : "Shnoogz are fun"}, function(err,editResult){
          assert.ok(err === null,err);
          edition = editResult;
          done();
        });
      });
    });

    it("is successful", function(){
      edition.success.should.equal(true);
    });
    it("sets the title to Shnoogz are fun", function(){
      edition.article.title.should.equal("Shnoogz are fun");
    });
    it("doesn't change the slug", function(){
      edition.article.slug.should.equal("something-nice-2");
    });
  });

  describe("editing a post slug with a valid slug", function(){
    var edition = {};
    before(function(done){
      var article = {title : "Something Nice 3", body : "A body bod", slug : "boopy-boo"};
      writer.saveDraft({article : article, author : testAuthor}, function(err,result){
        assert.ok(err === null,err);
        //now go and change it
        editor.editArticle({id : result.article.id, slug : "doody-doo"}, function(err,editResult){
          assert.ok(err === null,err);
          edition = editResult;
          done();
        })
      });
    });

    it("is successful", function(){
      edition.success.should.equal(true);
    });
    it("sets the slug to doody-doo", function(){
      edition.article.slug.should.equal("doody-doo");
    });

  });

  describe("editing a post slug with an valid slug using spaces etc", function(){
    var edition = {};
    before(function(done){
      var article = {title : "Something Nice 4", body : "A body bod", slug : "boopy-boo 1"};
      writer.saveDraft({article : article, author : testAuthor}, function(err,result){
        assert.ok(err === null,err);
        //now go and change it
        editor.editArticle({id : result.article.id, slug : "Ugly # Bacon ** Shno()#(222z"}, function(err,editResult){
          assert.ok(err === null,err);
          edition = editResult;
          done();
        })
      });
    });

    it("is successful", function(){
      edition.success.should.equal(true);
    });
    it("sets the slug to ugly-bacon-shno222z", function(){
      edition.article.slug.should.equal("ugly-bacon-shno222z");
    });
  });
  describe("editing an article with an id and no changes", function(){
    var edition = {};
    before(function(done){
      var article = {title : "Something Nice 5", body : "A body bod", slug : "boopy-boo 2"};
      writer.saveDraft({article : article, author : testAuthor}, function(err,result){
        assert.ok(err === null,err);
        //now go and change it
        editor.editArticle({id : result.article.id}, function(err,editResult){
          assert.ok(err === null,err);
          edition = editResult;
          done();
        })
      });
    });

    it("is successful", function(){
      edition.success.should.equal(true);
    });

  });

  describe("editing an article without an id", function(){
    var edition = {};
    before(function(done){
      var article = {title : "Something Nice 6", body : "A body bod", slug : "boopy-boo 3"};
      writer.saveDraft({article : article, author : testAuthor}, function(err,result){
        assert.ok(err === null,err);
        //now go and change it
        editor.editArticle({title : "I'm a mouth-breather"}, function(err,editResult){
          //assert.ok(err === null,err);
          edition = editResult;
          done();
        })
      });
    });

    it("is not successful", function(){
      edition.success.should.equal(false);
    });
    it("provides a message", function(){
      edition.message.should.equal("Be sure to send in an ID - don't know what to change otherwise");
    });
  });

  describe("editing an article without sending in changes", function(){
    var edition = {};
    before(function(done){
      var article = {title : "Something Nice 7", body : "A body bod", slug : "boopy-boo 4"};
      writer.saveDraft({article : article, author : testAuthor}, function(err,result){
        assert.ok(err === null,err);
        //now go and change it
        editor.editArticle(null, function(err,editResult){
          //assert.ok(err === null,err);
          edition = editResult;
          done();
        })
      });
    });

    it("is not successful", function(){
      edition.success.should.equal(false);
    });
    it("provides a message", function(){
      edition.message.should.equal("No changes to be made");
    });
  });

  describe("changing tags", function(){
    var edition = {};
    before(function(done){
      var article = {title : "Something Nice 34", body : "A body bod", slug : "boopy-boo 5"};
      writer.saveDraft({article : article, author : testAuthor}, function(err,result){
        assert.ok(err === null,err);
        //now go and change it
        editor.editArticle({id : result.article.id, tags : ["steve", "meat"]}, function(err,editResult){
          assert.ok(err === null,err);
          edition = editResult;
          done();
        })
      });
    });

    it("is successful", function(){
      edition.success.should.equal(true);
    });

  });
  describe("setting status to published", function(){
    var edition = {};
    before(function(done){
      var article = {title : "Something Nice 44", body : "A body bod", slug : "boopy-boo 6"};
      writer.saveDraft({article : article, author : testAuthor}, function(err,result){
        assert.ok(err === null,err);
        //now go and change it
        editor.editArticle({id : result.article.id, status : "published"}, function(err,editResult){
          assert.ok(err === null,err);
          edition = editResult;
          done();
        })
      });
    });

    it("is successful", function(){
      edition.success.should.equal(true);
    });

    it("sets the status", function(){
      edition.article.status.should.equal("published");
    });
  });

  describe("setting status to invalid status", function(){
    var edition = {};
    before(function(done){
      var article = {title : "Something Nice", body : "A body bod", slug : "boopy-boo 7"};
      writer.saveDraft({article : article, author : testAuthor}, function(err,result){
        assert.ok(err === null,err);
        //now go and change it
        editor.editArticle({id : result.article.id, status : "shlonk"}, function(err,editResult){
          assert.ok(err === null,err);
          edition = editResult;
          done();
        })
      });
    });

    it("is successful", function(){
      edition.success.should.equal(true);
    });

    it("sets the status", function(){
      edition.article.status.should.equal("draft");
    });
  });

  describe("deleting a post", function(){
    var deleteResult = {};
    var newPostId = 0;
    before(function(done){
      var article = {title : "Something to be deleted", body : "A body bod", slug : "this-should-be-deleted"};
      var author = {name : "Testy test"};
      writer.saveDraft({article : article, author : author}, function(err,result){
        newPostId = result.article.id;
        assert.ok(err === null,err);
        //now go and change it
        editor.deleteArticle({id : newPostId}, function(err,finalResult){
          assert.ok(err === null,err);
          deleteResult = finalResult;
          done();
        })
      });
    });

    it("is successful", function(){
      deleteResult.success.should.equal(true);
    });

  });
});
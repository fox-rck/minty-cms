var should = require("should");
var Writer = require("../lib/writer");
var assert = require("assert");

//in-memory
var Datastore = require('nedb')
    , db = new Datastore();


var testAuthor = {name : "Testy test", email : "test@test.com"};

describe("Writers", function(){
  var writer = {};
  before(function(done){
    writer = new Writer(db);
  });

  describe('creating a valid article with no tags', function(){
    var edition = {};
    before(function(done){
      var article = {title : "Something Nice", body : "A body bod"};
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
      edition.article.title.should.equal("Something Nice");
      edition.article.body.should.equal("A body bod");
      edition.article.slug.should.equal("something-nice");
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
  describe('creating a valid article with tags', function(){
    var edition = {};
    before(function(done){
      var article = {title : "Something Nicer", body : "A body bod"};
      //load up a draft
      writer.saveDraft({article : article, author : testAuthor, tags : ["cheese", "meat"]}, function(err,result){
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
    it("creates tags for the article", function(){
      edition.article.getTags().success(function(tags){
        tags.length.should.equal(2);
      });
    })
  });
});
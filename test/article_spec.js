var should = require("should");
var assert = require("assert");
var Minty = require("../index");
require("date-utils")
var minty = {};
var testAuthor = {name : "Testy test", email : "test@test.com"};

describe("Articles", function(){

  before(function(done){
    Minty.init({db : "./test/test.db"}, function(err,configured){
      minty = configured;
      minty.deleteAllArticles(function(){
        done();
      });
    });

  });

  describe("creating with a slug, title, body and no tags", function () {
    var result = {};
    before(function (done) {
      var article = {title : "Test One", slug : "test-1", body : "Lorem Ipsum", author : testAuthor};
      minty.saveArticle(article, function(err, newArticle){
        result = newArticle;
        done();
      });
    });

    it('is successful', function () {
      result.success.should.equal(true);
    });

    it('creates an article', function () {
      result.article.should.be.defined;
    });
    it('sets the title, body, and slug', function () {
      result.article.title.should.equal("Test One");
      result.article.body.should.equal("Lorem Ipsum");
      result.article.slug.should.equal("test-1");
    });

    it('sets the status to DRAFT', function () {
      result.article.status.should.equal("draft")
    });

  });

  describe("creating with a slug, title, body and tags", function () {
    var result = {};
    before(function (done) {
      var article = {title : "Test Two", slug : "test-2", body : "Lorem Ipsum", tags : ["fun", "bonk"], author : testAuthor};
      minty.saveArticle(article, function(err, newArticle){
        result = newArticle;
        done();
      });
    });

    it('is successful', function () {
      result.success.should.equal(true);
    });

    it('creates tags', function () {
      result.article.tags.length.should.equal(2);
    });
  });

  describe("creating without a slug, but with title and body", function () {
    var result = {};
    before(function (done) {
      var article = {title : "Test Three", body : "Lorem Ipsum", tags : ["fun", "bonk"], author : testAuthor};
      minty.saveArticle(article, function(err, newArticle){
        result = newArticle;
        done();
      });
    });

    it('is successful', function () {
      result.success.should.equal(true);
    });

    it('sets the slug to test-three', function () {
      result.article.slug.should.equal("test-three");
    });
  });

  describe("publishing an article", function () {
    var result = {};
    before(function (done) {
      var article = {slug : "publish-me", title: "Test Three", body: "Lorem Ipsum", tags: ["fun", "bonk"], author: testAuthor};
      minty.saveArticle(article, function (err, saveResult) {
        minty.publishArticle(saveResult.article.slug, function(err,published){
          result = published;
          done();
        });
      });
    });

    it('is published', function () {
      result.isPublished().should.equal(true);
    });

    it('has a wordpress url', function () {
      var expectedURL = new Date().toFormat("/YYYY/mm/dd/") + result.slug;
      result.wordpressUrl().should.equal(expectedURL);
    });
  });

});

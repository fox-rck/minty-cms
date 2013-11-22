var should = require("should");
var assert = require("assert");
var Minty = require("../index");
require("date-utils")
var minty = {};
var testAuthor = {name : "Testy test", email : "rob@wekeroad.com"};

describe("Articles", function(){

  before(function(done){
    Minty.init({}, function(err,configured){
      minty = configured;
      done();
    });

  });

  describe("creating", function(){

    describe("with a slug, title, body and no tags", function () {
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
      it('has an author with a gravatar',function(){
        var url = result.article.author.gravatarUrl();
        console.log(url);
        url.length.should.be.greaterThan(0);  
      });

    });
    describe("with a slug, title, body and no author", function () {
      var result = {};
      before(function (done) {
        var article = {title : "Test Author", slug : "test-author", body : "Lorem Ipsum"};
        minty.saveArticle(article, function(err, newArticle){
          result = newArticle;
          done();
        });
      });

      it('is not successful', function () {
        result.success.should.equal(false);
      });

      it('offers a message', function () {
        result.message.should.equal("Need an author, title, and body");
      });

    });
    describe("with a slug, title, body and tags", function () {
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

    describe("without a slug, but with title and body", function () {
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
  });

  describe("editing", function(){

    describe("publishing a draft", function () {
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

    describe("unpublishing a published article", function () {
      var result = {};
      before(function (done) {
        var article = {slug : "publish-me", title: "Test Three", body: "Lorem Ipsum", tags: ["fun", "bonk"], author: testAuthor, status : "published", publishedAt : new Date()};
        minty.saveArticle(article, function (err, saveResult) {
          assert.ok(err === null, err);
          minty.unpublishArticle(saveResult.article.slug, function(err,unPubbed){
            result = unPubbed;
            done();
          });
        });
      });

      it('is NOT published', function () {
        result.isPublished().should.equal(false);
      });

      it('does not have a wordpress url', function () {
        should.not.exist(result.wordpressUrl());
      });
    });
    describe("taking offline", function () {
      var result = {};
      before(function (done) {
        var article = {slug : "publish-me", title: "Test Three", body: "Lorem Ipsum", tags: ["fun", "bonk"], author: testAuthor, status : "published", publishedAt : new Date()};
        minty.saveArticle(article, function (err, saveResult) {
          minty.takeArticleOffline(saveResult.article.slug, function(err,unPubbed){
            result = unPubbed;
            done();
          });
        });
      });

      it('is NOT published', function () {
        result.isPublished().should.equal(false);
      });

      it('does not have a wordpress url', function () {
        should.not.exist(result.wordpressUrl());
      });
    });

    describe("replacing tags", function () {
      var result = {};
      before(function (done) {
        var article = {slug: "publish-me", title: "Test Three", body: "Lorem Ipsum", tags: ["fun", "bonk"], author: testAuthor, status: "published", publishedAt: new Date()};
        minty.saveArticle(article, function (err, saveResult) {
          minty.tagArticle(saveResult.article.slug, ["foot", "pitched", "klonk"], function (err, unPubbed) {
            result = unPubbed;
            done();
          });
        });
      });

      it('replaces existing tags', function () {
        result.tags.length.should.equal(3);
        result.tags.indexOf("foot").should.be.greaterThan(-1);
        result.tags.indexOf("pitched").should.be.greaterThan(-1);
        result.tags.indexOf("klonk").should.be.greaterThan(-1);
      });

    });


  });

  describe("deleting", function () {

    describe("a single post", function () {
      var result = {};
      before(function (done) {
        var article = {slug: "publish-me", title: "Test Three", body: "Lorem Ipsum", tags: ["fun", "bonk"], author: testAuthor, status: "published", publishedAt: new Date()};
        minty.saveArticle(article, function (err, saveResult) {
          result = saveResult;
          done();
        });
      });

      it('removes the article from the DB', function (done) {
        minty.deleteArticle({slug : result.article.slug}, function(err,removed){
          removed.should.equal(1);
          done();
        })
      });

    });
  });

});

//var should = require("should");
//var Minty = require("../index");
//var assert = require("assert");
//
//var testAuthor = {name : "Testy test", email : "test@test.com"};
//
//describe("The API", function(){
//
//  var minty = {};
//  before(function(done){
//    minty = new Minty({db : "./test/test.db"});
//    minty.dropAndInstall(function(err,result){
//      assert.ok(err === null, err);
//      done();
//    });
//  });
//
//  it('drops and installs', function(){
//    //if we get here all's well
//    minty.should.be.defined;
//  });
//
//  describe("saving a draft", function(){
//    var draftResult = {};
//    var article = {title : "API Tests Considered Exciting", body : "lorem ipsum"};
//    before(function(done){
//      minty.saveDraft({article : article, author : testAuthor}, function(err,result){
//        draftResult = result;
//        done();
//      });
//    });
//
//    it("is successful", function(){
//      draftResult.success.should.equal(true);
//    });
//
//    it("creates a draft article record", function(){
//      draftResult.article.should.be.defined;
//      draftResult.article.status.should.equal("draft");
//    });
//  });
//
//  describe("publishing a post", function(){
//    var pubResult = {};
//    var article = {title : "API Tests Considered Exciting", body : "lorem ipsum", slug : "thingy-thing"};
//    before(function(done){
//      minty.saveDraft({article : article, author : testAuthor}, function(err,result){
//        assert.ok(err === null, err);
//        minty.publishArticle("thingy-thing", function(err,finalResult){
//          assert.ok(err === null, err);
//          pubResult = finalResult;
//          done();
//        });
//      });
//    });
//
//    it("is set to published", function(){
//      pubResult.article.status.should.equal("published");
//    });
//
//  });
//
//});
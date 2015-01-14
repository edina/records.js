var RecordsJS = require('../src/index.js');
var assert = require('assert');


describe('Records.JS', function(){
    var records = new RecordsJS("records");
    var testData = {'itchy': 'scratchy'};

    describe('put', function(){
        it('save an empty record', function(){
            assert.equal(true, records.put('testData', testData));
        });
    });

    describe('get', function(){
        it('retrieve a record by id', function(){
            assert.deepEqual(testData, records.get('testData'));
        });
    });

});
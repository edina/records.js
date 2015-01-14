var RecordsJS = require('../src/index.js');
var assert = require('assert');


describe('Records.JS', function(){
    var records = new RecordsJS("records");
    var testData = {'itchy': 'scratchy'};

    describe('put', function(){
        it('save a record', function(){
            assert.equal(true, records.put('testData', testData));
        });
    });

    describe('get', function(){
        it('retrieve a record', function(){
            assert.deepEqual(testData, records.get('testData'));
        });

        it('retrieve a record and metadata', function(){
            var annotation = {};
            annotation.record = testData;
            assert.deepEqual(annotation, records.get('testData', {metadata: true}));
        });

    });

});
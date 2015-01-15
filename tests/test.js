var RecordsJS = require('../src/index.js');
var assert = require('assert');


describe('Records.JS', function(){
    var records = new RecordsJS("records");
    var testData = [
        { key: 'record1', value: {'zig': 'zag'} },
        { key: 'record2', value: {'yo': 'yo'} },
        { key: 'record3', value: {'bing': 'bang'} },
    ];

    var toRecord = function(a){
        return a.value;
    };

    var toMetaData = function(a){
        return {_id: a.key, record: a.value};
    };

    records.deleteAll();

    describe('put', function(){
        it('save a record', function(){
            assert.equal(true, records.put(testData[0].key, testData[0].value));
        });
    });

    describe('get', function(){
        it('retrieve a record', function(){
            assert.deepEqual(testData[0].value, records.get(testData[0].key));
        });

        it('retrieve a record with metadata', function(){
            assert.deepEqual(toMetaData(testData[0]), records.get(testData[0].key, {metadata: true}));
        });

    });

    describe('putAll', function(){
        it('put several records', function(){
            assert.deepEqual([true, true], records.putAll(testData.slice(1, testData.length)));
        });
    });


    describe('getAll', function(){
        it('retrieve all records', function(){
            var _testData = testData.map(toRecord);
            assert.deepEqual(_testData, records.getAll());
        });

        it('retrieve all records with metadata', function(){
            var _testData = testData.map(toMetaData);
            assert.deepEqual(_testData, records.getAll({metadata: true}));
        });
    });

    describe('delete', function(){
        it('delete a record', function(){
            var recordKey = testData[0].key;
            records.delete(recordKey);
            assert.equal(null, records.get(recordKey));

        });

        it('all the records', function(){
            records.deleteAll();
            records.buildIndex();
            assert.deepEqual([], records.getAll());

        });
    });


});
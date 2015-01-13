var RecordsJS = require('../src/index.js');
var assert = require('assert');


describe('Records.JS', function(){
    describe('put', function(){
        it('save an empty record', function(){
            RecordsJS.put({});
        });
        it('save an record with schema', function(){
            RecordsJS.put({}, {});
        });
    });

    describe('get', function(){
        it('retrieve a record by id', function(){
            RecordsJS.get(0);
        });
    });

});
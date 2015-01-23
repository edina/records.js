var RecordsJS = require('../src/index.js');
var assert = require('assert');
var fs = require('fs');


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

    describe('schema', function(){
        var geoJSONSchema = JSON.parse(fs.readFileSync(__dirname + '/../schemas/geojson/geojson.json'));
        var geoJSONBBox = JSON.parse(fs.readFileSync(__dirname + '/../schemas/geojson/bbox.json'));
        var geoJSONCRS = JSON.parse(fs.readFileSync(__dirname + '/../schemas/geojson/crs.json'));
        var geoJSONGeometry = JSON.parse(fs.readFileSync(__dirname + '/../schemas/geojson/geometry.json'));

        var geoJSONRecord = {
            "type": "Feature",
            "geometry": {
            "type": "Point",
                "coordinates": [125.6, 10.1]
            },
            "properties": {
                "name": "Dinagat Islands"
            }
        };

        var NonTypeGeoJSONRecord = {
            "geometry": {
            "type": "Point",
                "coordinates": [125.6, 10.1]
            },
            "properties": {
                "name": "Dinagat Islands"
            }
        };

        it('add a schema', function(){
            records.addSchema(geoJSONSchema);
            records.addSchema(geoJSONBBox);
            records.addSchema(geoJSONCRS);
            records.addSchema(geoJSONGeometry);
        });

        it('get schema', function(){
            var schema = records.getSchema(geoJSONSchema.id);
            assert.deepEqual(schema, geoJSONSchema);
        });

        it('test negative against schema', function(){
            assert.equal(false, records.validateSchema(geoJSONSchema.id, NonTypeGeoJSONRecord));
        });

        it('test positive against schema', function(){
            var valid;
            valid = records.validateSchema(geoJSONSchema.id, geoJSONRecord);
            assert.equal(true, valid);
        });

        it('delete schema', function(){
            records.deleteSchema(geoJSONSchema.id);
            assert.equal(undefined, records.getSchema(geoJSONSchema.id));
        });
    });



});
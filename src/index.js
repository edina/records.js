(function (root, factory) {
    "use strict";

    if(typeof define === 'function' && define.amd){
        define(['extend'], function(extend){
          return (root.RecordsJS = factory(extend));
        });
    }else if(typeof module === 'object' && module.exports){
        module.exports = (root.RecordsJS = factory(require('extend')));
    }else{
        root.pcapi = factory(root.extend);
    }
}(this, function(extend){
"use strict";

if (typeof localStorage === 'undefined' || localStorage === null) {
  var LocalStorage = require('node-localstorage').LocalStorage;
  var localStorage = new LocalStorage('./localstorage.db');
}

var defaults = {
    dataPrefix: 'recordsjs@',
    nameSeparator: '#'
};

var RecordsJS = function (name, options){
    var data;

    this.options = extend(defaults, options);
    this.name = name;
    this.dataStore = this.options.dataPrefix + this.name + this.options.nameSeparator;
    this.buildIndex();
};

RecordsJS.prototype.serialize = function(id, data){
    var dataStr;

    try{
        dataStr = JSON.stringify(data);
        localStorage.setItem(id, dataStr);
        return true;
    }catch(ex){
        console.error(ex);
        return false;
    }
};

RecordsJS.prototype.deserialize = function(id){
    var data, dataStr;

    dataStr = localStorage.getItem(id);

    if(dataStr !== null){
        try{
            data = JSON.parse(dataStr);
            return data;
        }catch(ex){
            console.error(ex);
            return null;
        }
    }else{
        return null;
    }
};

RecordsJS.prototype.buildInternalId = function(id){
    return this.dataStore + id;
};

RecordsJS.prototype.buildIndex = function(){
    var regex, key, matches;

    regex = new RegExp('^' + this.dataStore + '(.+)$');

    this.index = {};
    for(var i=0, len=localStorage.length; i<len; i++){
        key = localStorage.key(i);

        matches = key.match(regex);
        if(matches !== null){
            this.index[matches[1]] = key;
        }
    }
};


RecordsJS.prototype.put = function(id, object, options){
    var annotation, internalId, result;

    options = extend({}, options);
    internalId = this.buildInternalId(id);

    if(options.metadata !== true){
        annotation = {};
        annotation._id = id;
        annotation.record = object;
    }else{
        annotation = object;
        annotation._id = id;
    }

    result = this.serialize(internalId, annotation);

    if(result === true){
        this.index[id] = internalId;
    }

    return result;
};

RecordsJS.prototype.putAll = function(objects, options){
    //options = extend({}, options);
    var result, results;

    results = [];
    for(var i=0, len = objects.length; i<len; i++){
        result = this.put(objects[i].key, objects[i].value, options);
        results.push(result);
    }
    return results;
};

RecordsJS.prototype.get = function(id, options){
    var annotation, internalId;

    options = extend({}, options);
    internalId = this.buildInternalId(id);

    annotation = this.deserialize(internalId);

    if(options.metadata === true || annotation === null){
        return annotation;
    }else{
        return annotation.record;
    }
};

RecordsJS.prototype.getAll = function(options){
    var items, annotation, regex, matches, item;

    options = extend({}, options);

    items = [];
    for(var key in this.index){
        if(this.index.hasOwnProperty(key)){
            annotation = this.deserialize(this.index[key]);
            if(options.metadata === true){
                item = annotation;
            }else{
                item = annotation.record;
            }

            items.push(item);
        }
    }

    return items;
};


return RecordsJS;

}));
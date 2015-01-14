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
    dataPrefix: 'recordsjs@'
};

var RecordsJS = function (name, options){
    var data;

    this.options = extend(defaults, options);
    this.dataStore = this.options.dataPrefix + name + '#';
    this.name = name;

    data = this.deserialize(this.dataStore);
    if(data === null){
        this.serialize(this.dataStore, {});
    }
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

RecordsJS.prototype.put = function(id, object, options){
    var annotation, internalId;

    options = extend({}, options);
    internalId = this.buildInternalId(id);

    if(options.metadata !== true){
        annotation = {};
        annotation.record = object;
    }else{
        annotation = object;
    }

    return this.serialize(internalId, annotation);
};

RecordsJS.prototype.putAll = function(objects, options){

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

};


return RecordsJS;

}));
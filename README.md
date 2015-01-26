records.js
==========

A schema aware javascript datastore

## Install


``` npm install . ```


## Usage

#### Importing the module

```

// commonsjs
var RecordsJS = require('RecordsJS');

// amd
require(['RecordsJS'], function(RecordsJS)){
...
}

```

#### Creating a store

```
var records = new RecordsJS('records');

```

#### Storing an object
```
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


records.put(1321344155, geoJSONRecord);
```

#### Retrieving an object

```
// Retrieve an object
records.get(1321344155);
```
```
{
	"type": "Feature",
	"geometry": {
		"type": "Point",
		"coordinates": [125.6, 10.1]
	},
	"properties": {
		"name": "Dinagat Islands"
	}
}
```

```
// Retrieve an object with metadata
records.get(1321344155, {metadata: true});
```
```
{
	_id: 1321344155,
	record: {
		"type": "Feature",
		"geometry": {
			"type": "Point",
			"coordinates": [125.6, 10.1]
		},
		"properties": {
			"name": "Dinagat Islands"
		}
	}
}
```


#### Delete an object
```
records.delete(1321344155);
```



## Test

```npm test```
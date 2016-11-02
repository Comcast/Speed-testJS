/*
 * *
 *  Copyright 2014 Comcast Cable Communications Management, LLC
 *
 *  Licensed under the Apache License, Version 2.0 (the "License");
 *  you may not use this file except in compliance with the License.
 *  You may obtain a copy of the License at
 *
 *  http://www.apache.org/licenses/LICENSE-2.0
 *
 *  Unless required by applicable law or agreed to in writing, software
 *  distributed under the License is distributed on an "AS IS" BASIS,
 *  WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 *  See the License for the specific language governing permissions and
 *  limitations under the License.
 * /
 */

var AWS = {};

AWS = require('aws-sdk');
//change the profile name to your own profile
//default is the local profile
AWS.config.credentials = new AWS.SharedIniFileCredentials({profile: 'default'});
//change the end point and region of your own if you want to work with your dynamo account
//change the table name in createTableParams and also while inserting the data
AWS.config.update({
    region: 'us-east-1',
    endpoint: 'http://localhost:8000'
});

var dynamodb = new AWS.DynamoDB();

//required params for creating a table
var createTableparams = {
    "GlobalSecondaryIndexes": [
        {
            "KeySchema": [
                {
                    "KeyType": "HASH",
                    "AttributeName": "Sitename"
                }
            ],
            "IndexName": "SitenameIndex",
            "Projection": {
                "ProjectionType": "ALL"
            },
            "ProvisionedThroughput": {
                "ReadCapacityUnits": 1,
                "WriteCapacityUnits": 1
            }
        },
        {
            "KeySchema": [
                {
                    "KeyType": "HASH",
                    "AttributeName": "IPv4Address"
                }
            ],
            "IndexName": "IPv4AddressIndex",
            "Projection": {
                "ProjectionType": "ALL"
            },
            "ProvisionedThroughput": {
                "ReadCapacityUnits": 1,
                "WriteCapacityUnits": 1
            }
        },
        {
            "KeySchema": [
                {
                    "KeyType": "HASH",
                    "AttributeName": "Location"
                }
            ],
            "IndexName": "LocationIndex",
            "Projection": {
                "ProjectionType": "ALL"
            },
            "ProvisionedThroughput": {
                "ReadCapacityUnits": 1,
                "WriteCapacityUnits": 1
            }
        }
    ],

    "AttributeDefinitions": [
        {
            "AttributeName": "Hostname",
            "AttributeType": "S"
        },
        {
            "AttributeName": "Sitename",
            "AttributeType": "S"
        },
        {
            "AttributeName": "IPv4Address",
            "AttributeType": "S"
        },
        {
            "AttributeName": "Location",
            "AttributeType": "S"
        }
    ],
    //change the table name to use your own
    //if you use your table name, change the table name in index.js in testServer endpoint or use (SpeedTestServerInfo) this table name
    "TableName": "TableName",
    "KeySchema": [
        {
            "KeyType": "HASH",
            "AttributeName": "Hostname"
        }
    ],
    "ProvisionedThroughput": {
        "ReadCapacityUnits": 1,
        "WriteCapacityUnits": 1
    }
};

var serverInfo = [
    {
        Hostname: 'Hostname',
        Sitename: 'Sitename',
        Location: 'Location',
        IPv4Address: 'IPv4Address',
        IPv6Address: 'IPv6Address'
    }
];

var createTable = function (param, callback) {
    try {
        dynamodb.createTable(param, function (err, data) {
            if (!err) {
                if (typeof(callback) === 'function') {
                    callback(data);
                }
            } else {
                throw (err);
            }
        });
    }
    catch (err) {
        console.log('error in updating the item' + err);
    }
};

var putItem = function (param, callback) {
    try {
        dynamodb.putItem (param, function (err, data) {
            if (!err) {
                if (typeof(callback) === 'function') {
                    callback(data);
                }
            } else {
                throw (err);
            }
        });
    }
    catch (err) {
        console.log('error in updating the data' + err);
    }
};

var callback = function (data) {
    console.log(data);
    for (var i = 0; i < serverInfo.length; i++) {
        var updateParams = {
            //change the table name to match the above
            TableName: 'TableName',
            Item: {
                Hostname: {'S': serverInfo[i].Hostname},
                Sitename: {'S': serverInfo[i].Sitename},
                Location: {'S': serverInfo[i].Location},
                IPv4Address: {'S': serverInfo[i].IPv4Address},
                IPv6Address: {'S': serverInfo[i].IPv6Address}
            }
        };
        putItem(updateParams, putItemCallback);
    }
};

var putItemCallback = function (data) {
    console.log(data)
};

createTable(createTableparams, callback);

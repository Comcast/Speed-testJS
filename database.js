var AWS = {};
AWS = require('aws-sdk');
AWS.config.credentials = new AWS.SharedIniFileCredentials({profile: 'default'});
AWS.config.update({
    region: 'us-east-1',
    endpoint: 'http://localhost:8000'
});
var dynamodb = new AWS.DynamoDB();
var params = {
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
    "TableName": "SpeedTestServerInfo",
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
        Hostname: 'qoecnf-sncl-02.sys.comcast.net',
        Sitename: 'CA',
        Location: 'Santa Clara',
        IPv4Address: '69.241.74.66',
        IPv6Address: '2001:558:fe0d:12::2',
        Status: 'Active'
    },
    {
        Hostname: 'stc-plfi-01.sys.comcast.net',
        Sitename: 'NJ',
        Location: 'Plainfield',
        IPv4Address: '69.241.70.138',
        IPv6Address: '2001:558:fe36:11::2',
        Status: 'Active'
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
                console.log('write executed successfully');
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
            TableName: 'SpeedTestServerInfo',
            Item: {
                Hostname: {'S': serverInfo[i].Hostname},
                Sitename: {'S': serverInfo[i].Sitename},
                Location: {'S': serverInfo[i].Location},
                IPv4Address: {'S': serverInfo[i].IPv4Address},
                IPv6Address: {'S': serverInfo[i].IPv6Address},
                Status: {'S': serverInfo[i].Status}
            }
        };
        putItem(updateParams, putItemCallback);
    }
};
var putItemCallback = function (data) {
    console.log(data)
};
createTable(params, callback);
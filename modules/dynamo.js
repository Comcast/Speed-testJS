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


var AWS = require('../config/aws/awsSettings');
var dynamo = new AWS.DynamoDB();

/**
 * getItem returns operation returns set of attributes with the given primary key
 * @param param object with table name and primary key
 * @param callback handles the response
 */
var getItem = function (param, callback) {
    try {
        dynamo.getItem(param, function (err, data) {
            if (!err) {
                console.log('get success');
                if (typeof(callback) === 'function') {
                    callback(data);
                }
            } else {
                throw (err);
            }
        });
    }
    catch (err) {
        console.log('error in getting data' + err);
    }
};

/**
 * Creates a new Item or replaces an old item with a new item
 * @param param object with table name and primary key and
 * @param callback handles the response
 */
var putItem = function (param, callback) {
    try {
        dynamo.putItem (param, function (err, data) {
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

/**
 *
 * @param param object with the table name
 * @param callback handles the response
 */
var deleteItem = function (param, callback) {
    try {
        dynamo.deleteItem(param, function(err, data) {
            if (!err) {
                console.log('delete executed successfully');
                if (typeof(callback) === 'function') {
                    callback(data);
                }
            } else {
                throw (err);
            }
        });
    }
    catch (err) {
        console.log('error in deleting the data' + err);
    }
};

/**
 * Query operation uses the primary key or sedondary index to directly access items from table
 * @param param object consists of either primary key or secondary index with table name
 * @param callback handles the response
 */
var query = function (param, callback) {
    try {
        dynamo.query(param, function(err, data) {
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
        console.log('error in getting the query results' + err);
    }
};

/**
 * updateItem edit's an existing item's attribute or adds a new item to the table
 * @param param object with attribute to update and the value with the table name
 * @param callback handles the response
 */
var updateItem = function (param, callback) {
    try {
        dynamo.updateItem(param, function(err, data) {
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

/**
 * Scan returns one or more items and item attributes by accessing every item in a table
 * @param param pass the table name
 * @param callback handles the response
 */
var scanTable = function (param, callback) {
    try {
        dynamo.scan(param, function(err, data) {
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

module.exports = {
    getItem: getItem,
    putItem: putItem,
    deleteItem: deleteItem,
    query: query,
    updateItem: updateItem,
    scanTable: scanTable
};


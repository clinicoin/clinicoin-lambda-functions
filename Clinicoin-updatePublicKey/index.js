'use strict';

console.log('Loading function');

const aws = require('aws-sdk');

var ddb = new aws.DynamoDB({apiVersion: '2012-10-08'});

exports.handler = (event, context, callback) => {
    
    let response = {
      "statusCode": 400,
      "headers": {
          "requestid": context.awsRequestId
      },
      "body": 'empty message',
      "isBase64Encoded": false
    };
    

    if (event.publicKey == "" || event.publicKey == undefined || event.publicKey == null) {
        console.log('No public key');
        response.body = "updatePublicKey failed: invalid key";
        callback(null, response);
        return;
    }
    
    if (event.username == "" || event.username == undefined || event.username == null) {
        console.log('No username');
        response.body = "updatePublicKey failed: no username";
        callback(null, response);
        return;
    }

    var params = {
      TableName: 'ClinicoinDirectory',
      Item: {
        'UserId': {S: event.username },
        'PublicKey' : {S: event.publicKey},
        'Sub' : {S: event.sub},
        'Phone' : {S: event.phone},
        'Email' : {S: event.email},
      }
    };

    // Call DynamoDB to add the item to the table
    ddb.putItem(params, function(err, data) {
      if (err) {
        console.log(err);
        response.body = "putItem failed: "+err.message;
      } else {
        console.log('Update success');
        response.statusCode = 200;
        response.body = "value updated";
      }
      callback(null, response);
    });
};
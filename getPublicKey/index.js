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
    
    if (event.username == "" || event.username == undefined || event.username == null) {
        console.log('No username');
        response.body = "updatePublicKey failed: no username";
        callback(null, response);
        return;
    }
    
    var params = {
      Key: { "UserId": { S: event.username } },
      TableName: "ClinicoinDirectory"
    };

    ddb.getItem(params, function(err, data) {
      if (err) {
        console.log(err);
        response.body = "public key retrieve failed: "+err.message;
      } else {
        console.log('retrieve success');
        response.statusCode = 200;
        response.body = data.Item;
      }
      callback(null, response);
    });

};
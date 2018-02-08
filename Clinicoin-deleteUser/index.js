'use strict';

console.log('Loading function');

const aws = require('aws-sdk');

var cisp = new aws.CognitoIdentityServiceProvider({apiVersion: '2016-04-18'});

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
    
    if ( ! /test\d+/i.test(event.username)) {
      response.body = 'username must be a test user';
    }
    
    var cisp_params = {
      UserPoolId: 'us-east-1_QCQ5kVlpW',
      Username: event.username
    };
    
    var ddb_params = {
      TableName: 'ClinicoinDirectory',
      Item: {
        'UserId': {S: event.username },
        'PublicKey' : {S: event.publicKey},
        'Sub' : {S: event.sub},
      }
    };
    
    cisp.adminDeleteUser(cisp_params, function(err, data) {
      if (err) {
        console.log(err);
        response.body = "delete failed: "+err.message;
        callback(null, response);
      } else {
        ddb.putItem(ddb_params, function(err, data) {
          if (err) {
            console.log(err);
            response.body = "putItem failed: "+err.message;
          } else {
            console.log('delete success');
            response.statusCode = 200;
            response.body = "delete success";
          }
          callback(null, response);
        });
      }
    });
};
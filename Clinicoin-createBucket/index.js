'use strict';

console.log('Loading function');

const aws = require('aws-sdk');

const s3 = new aws.S3({apiVersion: '2006-03-01'});

exports.handler = (event, context, callback) => {
    
    if (event.bucket == "" || event.bucket == undefined || event.bucket == null) {
        const response = {
          "statusCode": 400,
          "headers": {
              "requestid": context.awsRequestId,
          },
          "body": "Bucket create failed: invalid name",
          "isBase64Encoded": false
        };
        callback(null, response);
        return;
    }
    
    console.log("clientID = " + JSON.stringify(context.identity));
    
    console.log("Create s3 bucket: "+event.bucket);
    const s3_params = {
        Bucket: "/2017-09-26/"+event.bucket
    };
    const s3_promise = s3.createBucket(s3_params).promise();

    Promise.all([
        s3_promise
    ])
    .then(() => {
        const response = {
            "statusCode": 200,
            "headers": {
                "requestid": context.awsRequestId,
            },
            "body": "Channel created "+event.bucket,
            "isBase64Encoded": false
        };
        callback(null, response);
    });
};
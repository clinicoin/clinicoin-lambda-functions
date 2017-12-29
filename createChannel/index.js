'use strict';

console.log('Loading function');

const aws = require('aws-sdk');

const sqs = new aws.SQS({apiVersion: '2012-11-05'});

const s3 = new aws.S3({apiVersion: '2006-03-01'});

exports.handler = (event, context, callback) => {
    
    if (event.queueName == "" || event.queueName == undefined || event.queueName == null) {
        const response = {
          "statusCode": 400,
          "headers": {
              "requestid": context.awsRequestId,
          },
          "body": "Queue create failed: invalid queue name",
          "isBase64Encoded": false
        };
        callback(null, response);
        return;
    }
    
    console.log("clientID = " + JSON.stringify(context.identity));
    
    event.queueName = "Clinicoin-Mosio-"+event.queueName;
    

    console.log("Create queue: "+event.queueName);
    const queue_params = {
      QueueName: event.queueName+'.fifo',
      Attributes: {
        'FifoQueue': 'true'
      }
    };
    const queue_promise = sqs.createQueue(queue_params).promise();

    /*
    console.log("Create s3 bucket: "+event.queueName);
    const s3_params = {
        Bucket: event.queueName,
        GrantWriteACP: 'EmailAddress=a101@mailinator.com'
    };
    const s3_promise = s3.createBucket(s3_params).promise();
    */
    
    Promise.all([
        //s3_promise,
        queue_promise
    ])
    .then(() => {
        const response = {
            "statusCode": 200,
            "headers": {
                "requestid": context.awsRequestId,
            },
            "body": "Channel created "+event.queueName,
            "isBase64Encoded": false
        };
        callback(null, response);
    });
};
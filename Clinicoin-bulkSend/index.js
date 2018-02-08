'use strict';

console.log('Loading function');

const aws = require('aws-sdk');

const s3 = new aws.S3({apiVersion: '2006-03-01'});

var ddb = new aws.DynamoDB({apiVersion: '2012-10-08'});

const openpgp = require('openpgp');


exports.handler = (event, context, callback) => {

    let response = {
      "statusCode": 400,
      "headers": {
          "requestid": context.awsRequestId,
      },
      "body": "Bulk send failed: error unset",
      "isBase64Encoded": false
    };
        
    if (event.data == "" || event.data == undefined || event.data == null) {
        response.body = "Bulk send failed: no data set";
        callback(null, response);
        return;
    }
    
    if (event.sender == "" || event.sender == undefined || event.sender == null) {
        response.body = "Bulk send failed: no sender set";
        callback(null, response);
        return;
    }
    
    if (event.messageid == "" || event.messageid == undefined || event.messageid == null) {
        event.messageid = "msg_"+(new Date()).getTime();
        console.log("MessageId auto-set to "+event.messageid);
    }
    
    if (event.destinations == "" || event.destinations == undefined || event.destinations == null) {
        response.body = "Bulk send failed: destinations not an array";
        callback(null, response);
        return;
    }
    
    console.log("clientID = " + JSON.stringify(context.identity));
    
    let promise_list = [];
    for (let receiver of event.destinations.split(',')) {
        promise_list.push(sendData(event.sender, event.data, receiver, event.messageid));
    }
    
    Promise.all(promise_list)
    .then((results) => {
        response = {
            "statusCode": 200,
            "headers": {
                "requestid": context.awsRequestId,
            },
            "body": JSON.stringify({ status: "all data processed", results: results }),
            "isBase64Encoded": false
        };
        callback(null, response);
    });
};

const sendData = function(sender, data, receiver, messageid)
{
    let key;
    
    console.log("Sending to "+receiver);
    
    // retrieve key
    const dynamo_params = {
      Key: { "UserId": { S: receiver.trim() } },
      TableName: "ClinicoinDirectory"
    };
    
    ddb.getItem(dynamo_params, function(error, data) {
		if (error) {
		    // ddb error
            console.log(error.message);
    	    return { success: false, message: error.message };
    	}
    	else if (data.Item == null || data.Item == undefined || data.Item.length==0) {
            console.log("User not found");
    	    return { success: false, message: "user not found" };
		} 
		else {
            key = data.Item.PublicKey.S;
		}
		
		    // encrypt
    	let options = {
    		data: "----START ENVELOPE----\n\n"
    				+ JSON.stringify({ bulk: true, Sender: sender })
    				+ "\n\n----END ENVELOPE----\n\n"
    				+ data,
    		publicKeys: openpgp.key.readArmored(key).keys,
    	};
    
        openpgp.encrypt(options).then(function(enc_object) {
            console.log("data encrypted");

        	// write to s3
        	const time = (new Date()).getTime();
        
        	const s3params = {
        		Body: enc_object.data,
        		Bucket: 'clinicoin-users',
        		Key: receiver+'/'+messageid,
        		Expires: time + (30 * 24 * 60 * 60 * 1000)
        	};
        	
            s3.putObject(s3params, function(error) {
    			if (error) {
                    console.log(error.message);
            	    return { success: false, message: error.message };
    			} else {
                    console.log("Send success for "+receiver);	
                    return { success: true, message: 'message send success' };
    			}
    		});
        });
	});
};
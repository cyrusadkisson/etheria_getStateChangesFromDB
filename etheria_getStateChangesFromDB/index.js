const AWS = require('aws-sdk');
const dynamoDB = new AWS.DynamoDB.DocumentClient();

function isNumeric(str) {
	if (typeof str != "string")
		return false; // we only process strings!  
	return !isNaN(str) && // use type coercion to parse the _entirety_ of the string (`parseFloat` alone does not do this)...
		!isNaN(parseFloat(str)); // ...and ensure strings of whitespace fail
}

exports.handler = async (event, context, callback) => {
	console.log("event=" + JSON.stringify(event));

	return new Promise((resolve, reject) => {

		if (!
			(
				event.params.querystring.version === "0.9" ||
				event.params.querystring.version === "1.0" ||
				event.params.querystring.version === "1.1" ||
				event.params.querystring.version === "1.2"
			)
		) {
			reject(new Error("Invalid or missing version parameter"));
			return;
		}
		console.log("version=" + event.params.querystring.version);

		
		if (!event.params.querystring.tileIndex) { 
			reject(new Error("event.params.querystring.tileIndex is missing"));
			return;
		}
		if (!isNumeric(event.params.querystring.tileIndex)) {
			reject(new Error("event.params.querystring.tileIndex is not a string or not numeric"));
			return;
		}
		if ((event.params.querystring.tileIndex * 1) > 1088) { 
			reject(new Error("event.params.querystring.tileIndex is invalid (too large, max 1088)"));
			return;
		}
		if ((event.params.querystring.tileIndex * 1) < 0) {
			reject(new Error("event.params.querystring.tileIndex is invalid (too small, min 0)"));
			return;
		}
		console.log("tileIndex=" + JSON.stringify(event.params.querystring.tileIndex));

//		var exclusiveStartKey1 = {
//			"tileIndexAndVersion": (event.params.querystring.tileIndex + "v" + event.params.querystring.version),
//			"blockNumber": (event.params.querystring.atBlock * 1)+1 // because the start key is EXCLUSIVE (not included), we need to search one block ahead of the target
//		};

		var params1 = {
			TableName: "EtheriaStateChanges2",
			KeyConditionExpression: "#vs = :vvv",
			ExpressionAttributeNames: { "#vs": "tileIndexAndVersion" },
			ExpressionAttributeValues: {
				":vvv": (event.params.querystring.tileIndex + "v" + event.params.querystring.version),
			},
			ScanIndexForward: false,
			// ProjectionExpression: projex,
//			ExclusiveStartKey: exclusiveStartKey1,
//			Limit: 1
		};

		dynamoDB.query(params1, function(err, data1) {
			if (err) {
				console.log("Error", err);
				reject(err);
			}
			else {
				if (data1.Items.length > 0)
					resolve(data1.Items);
				else
					resolve(); // found nothing, resolve with nothing
			}
		});
	});
};

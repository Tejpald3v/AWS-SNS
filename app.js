const express = require('express');
const app = express();
const LaunchDarkly = require('launchdarkly-node-server-sdk');
const AWS = require('aws-sdk');
require('dotenv').config();


app.get('/', (req, res) => {

    // LDClient must be a singleton
    // Create single, shared instance of the LaunchDarkly client.
    var ldClient = LaunchDarkly.init(process.env.YOUR_SDK_KEY);

    console.log("Message = " + req.query.message);

    // Create publish parameters
    var params = {
        Message: req.query.message,
        TopicArn: process.env.TOPIC
    };

    // Feature accessed by specific users.
    var user = {
        firstName: "Omkar",
        lastName: "Joshi",
        key: "omkar@example.com"
    }

    // The client will emit a ready event when it has been initialized and can serve feature flags.
    ldClient.once("ready", () => {

        ldClient.variation("aws-sns", user, false,
            (err, showFeature) => {
                if (showFeature) {
                    // application code to show the feature

                    // Create promise and SNS service object
                    var publishTextPromise = new AWS.SNS({ apiVersion: '2010-03-31' }).publish(params).promise();

                    // Handle promise's fulfilled/rejected states
                    publishTextPromise.then(
                        function (data) {
                            res.end(JSON.stringify({ MessageID: data.MessageId }));
                        }).catch(
                            function (err) {
                                res.end(JSON.stringify({ Error: err }));
                            });
                } else {
                    // the code to run if the feature is off
                    console.log("failure");
                    res.send("Turn the feature on!");
                }
                // ADDED: shut down the client, since we're about to quit
                ldClient.close();
            });
    });
});

app.listen(3000, () => console.log('SNS Service Listening on PORT 3000'))
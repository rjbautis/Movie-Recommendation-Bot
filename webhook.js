'use strict';

const 
  bodyParser = require('body-parser'),
  config = require('config'),
  express = require('express'),
  request = require('request'),
  app = express();

// Parse application/json
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true}));

// Environment variables
const VERIFY_TOKEN = process.env.VERIFY_TOKEN ? process.env.VERIFY_TOKEN : config.get('verificationToken');
const ACCESS_TOKEN = process.env.ACCESS_TOKEN ? process.env.ACCESS_TOKEN : config.get('pageAccessToken');


/*
 *  GET request for Facebook verification
 *
 */
app.get('/webhook', (req, res) => {

  // Parse webhook query parameters
  let mode = req.query['hub.mode'];
  let token = req.query['hub.verify_token'];
  let challenge = req.query['hub.challenge'];

  // Verify both parameters
  if (mode === 'subscribe' && token === VERIFY_TOKEN) {

    // Respond with challenge token
    console.log('WEBHOOK_VERIFIED');
    res.status(200).send(challenge);

  } else {

    // Respond with 403 if mode !=== 'subscribe' or token !=== VERIFY_TOKEN
    res.status(403).send('Request for Authentification Denied');
  }

});

/*
 * POST requests for messages
 *
 */ 
app.post('/webhook', (req, res) => {

  if (req.body.object === 'page') {

    // Iterate through each entry
    req.body.entry.forEach((entry) => {

      // entry.messaging will only ever have one message at a time, despite being an array
      console.log(entry.messaging[0]);

      // Retrieve sender psid
      let s_psid = entry.messaging[0].sender.id;
      console.log("Sender is "+ s_psid);

      // Determine if message or postback event
      if (entry.messaging[0].message) {
        
        // Helper function to parse message
        sendMessage(entry.messaging[0]);
      } else if (entry.messaging[0].postback) {
        
        // Helper function to parse postback
        console.log('need to write');
      }

   });

    res.status(200).send('EVENT_RECEIVED');
  } else {

    // Response with 404 if req.body.object !=== 'page' --> not from a page subscription
    res.status(404).end();
  }

});


function sendMessage(entry) {

  let sender = entry.sender.id;
  let text = entry.message.text;

  // Send POST request to Facebook Send API
  request({
    uri: "https://graph.facebook.com/v2.6/me/messages",
    qs: { access_token: ACCESS_TOKEN },
    method: "POST",
    json: {
      recipient: { id: sender},
      message: {text: text}
    }
  }, function (error, response)  {
    if (!error && response.statusCode === 200) {
      console.log('Success!');
    } else {
      console.log('Error!');
      console.log(response);
    }
  });
}


const server = app.listen(process.env.PORT || 3000, () => console.log('Listening on port ' + server.address().port));

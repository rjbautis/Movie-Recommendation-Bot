'use strict';

const 
  express = require('express'),
  request = require('request'),
  app = express();

// Parse application/json
app.use(express.json());

// Parse application/x-www-form-urlencoded
app.use(express.urlencoded({ extended: true}));


function handleMessages(s_psid, message) {

  let res;

  if (message.text) {
    res = {
      "text": message
    }
  }

  // Forward the new response to reply function
  replyMessage(s_psid, res);
}


function replyMessage(s_psid, res) {

  let req = {
    "recipient": { "id": s_psid },
    "message": res
  }

  // Send POST request to Facebook Send API
  request({
    "uri": "https://graph.facebook.com/v2.6/me/messages",
    "qs": { "access_token": "" },
    "method": "POST",
    "json": req
  }, function (error, response)  {
    if (error) {
      console.log('Error: ' + error);
    } else {
      console.log('Success!');
    }
  });
}


// GET request for Facebook verification
app.get('/webhook', (req, res) => {

  let VERIFY_TOKEN = "randToken";

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

// POST requests for messages
app.post('/webhook', (req, res) => {

  if (req.body.object === 'page') {

    // Iterate through each entry
    req.body.entry.forEach((entry) => {

      // entry.messaging will only ever have one message at a time, despite being an array
      console.log(entry.messaging[0]);

      // Retrieve sender psid
      let s_psid = entry.messaging[0].sender.id;

      // Determine if message or postback event
      if (entry.messaging[0].message) {
        
        // Helper function to parse message
        handleMessages(s_psid, entry.messaging[0].message);
      } else if (entry.messaging[0].postback) {
        
        // Helper function to pase postback
        handlePostback(s_psid, entry.messaging[0].postback);
      }

   });

    res.status(200).send('EVENT_RECEIVED');
  
  } else {

    // Response with 404 if req.body.object !=== 'page' --> not from a page subscription
    res.status(404).end();
  }

});

const server = app.listen(process.env.PORT || 3000, () => console.log('Listening on port ' + server.address().port));


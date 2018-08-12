'use strict';

const 
   express = require('express'),
   app = express();

// Parse application/json
app.use(express.json());

// Parse application/x-www-form-urlencoded
app.use(express.urlencoded({ extended: true}));


// GET request for Facebook verification
app.get('/webhook', (req, res) => {

   let VERIFY_TOKEN = "EAAeZCtgNhK2QBAH8v6cP5k4P03orndBndcvkR9JniP8x6nuM4F6gjiZAQspS1M6x8dlY1wznPV9Dtr5klIZA7bDekFgR8eyuD6BKyiiDYHR9r4fDL6Dt9JxBWLrfumDUHXKGKiZC9562Y3awvQAXldfRJINRgv7ZAN6CYeJkpmAZDZD";

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
         console.log(entry.messaging[0])
      });

      res.status(200).send('EVENT_RECEIVED');
   } else {

      // Response with 404 if req.body.object !=== 'page' --> not from a page subscription
      res.status(404).end();
   }

});

const server = app.listen(process.env.PORT || 3000, () => console.log('Listening on port ' + server.address().port));


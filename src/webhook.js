'use strict';

const 
  bodyParser = require('body-parser'),
  config = require('config'),
  dialogflow = require('dialogflow'),
  express = require('express'),
  request = require('request-promise'),
  app = express();

// Parse application/json
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true}));

// Environment variables
const VERIFY_TOKEN = process.env.VERIFY_TOKEN ? process.env.VERIFY_TOKEN : config.get('verificationToken');
const ACCESS_TOKEN = process.env.ACCESS_TOKEN ? process.env.ACCESS_TOKEN : config.get('pageAccessToken');
const TMDB_API_KEY = process.env.TMDB_API_KEY ? process.env.TMDB_API_KEY : config.get('tmbdApiKey');

/*
 *  INITIALIZE DIALOGFLOW SESSION
 *
 */
const projectId = 'tv-viunjh'; //https://dialogflow.com/docs/agents#settings
const sessionId = 'movie-recommendation-session-id';
const sessionClient = new dialogflow.SessionsClient();
const sessionPath = sessionClient.sessionPath(projectId, sessionId);

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
        messageHandler(entry.messaging[0]);
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


/*
 * POST requests for movie recommendations. Dialogflow API
 *
 */ 
app.post('/movies', (req, res) => {

  let options;

  console.log("test");
  // console.log(req.body.queryResult.parameters.movie);

  let movie = req.body.queryResult.parameters.movie;

  // If movie specified, display first five recommendations for that movie
  if (movie) {
    
    options = {
      method: 'GET',
      uri: 'https://api.themoviedb.org/3/search/movie',
      qs: {
        include_adult: 'false',
        page: '1',
        query: movie,
        language: 'en-US',
        api_key: TMDB_API_KEY
      }
    };

    request(options, function(error, response, body) {
        if (!error && response.statusCode === 200 && JSON.parse(body).results.length > 0) {
          console.log('Success! Movie name retrieved.');
        } else {
          console.log('Error! Movie name not retreived.');
          
          return res.json({
            fulfillmentText: 'I\'m sorry, but I can\'t interpret that movie. Please enter a different one.'
          });
        }
    })
    .then((data) => {

      if (data) {
        options = {
          method: 'GET',
          uri: 'https://api.themoviedb.org/3/movie/' + JSON.parse(data).results[0].id + '/recommendations',
          qs: {
            page: '1',
            language: 'en-US',
            api_key: TMDB_API_KEY
          }        
        };

        request(options, function(error, response, body) {
            if (!error && response.statusCode === 200 && JSON.parse(body).results.length > 0) {
              console.log('Success! Movie recommendations retreived.');
              
              // Grab recommendations
              let recList = JSON.parse(body).results.map(movie => movie.title);

              // let string = rec.slice(0, rec.length-1).join(', ') + ' and ' + rec[rec.length-1];

              let rec = recList[Math.floor(Math.random() * recList.length)];
              let msg = 'The Movie Database recommends you watch ' + rec + ' next!';

              return res.json({
                fulfillmentText: msg
              })
            } else {
              console.log('Error! Movie recommendations not retreived.');

              return res.json({
                fulfillmentText: 'Bummer, looks like there aren\'t any recommendations for ' + movie + ' :(' 
              });
            }
        });
      }
    })
    .catch((err) => console.log('goodbye'))
  }
})


function messageHandler(entry) {

  let sender = entry.sender.id;

  let query = entry.message.text;
  let languageCode = 'en-US';

  // The text query request.
  let request = {
    session: sessionPath,
    queryInput: {
      text: {
        text: query,
        languageCode: languageCode,
      },
    },
  };

  // Send request and log result
  sessionClient
    .detectIntent(request)
    .then(responses => {

      let body = {
        recipient: { id: sender },
        message: {text: responses[0].queryResult.fulfillmentText}
      }

    sendResponse(body);
  });
}


function sendResponse(body) {

  // Send POST request to Facebook Send API
  request({ method: "POST",
    uri: "https://graph.facebook.com/v2.6/me/messages",
    qs: { access_token: ACCESS_TOKEN },
    json: body
  }, function (error, response, body) {
    if (!error && response.statusCode === 200) {
      console.log('Success!');
    } else {
      console.log('Error!');
      console.log(response);
    }
  });
}

const server = app.listen(process.env.PORT || 3000, () => console.log('Listening on port ' + server.address().port));

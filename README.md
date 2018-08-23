# Messenger Movie Recommendation Bot
A Facebook Messenger Bot built with Node.js and the Google Cloud [Dialogflow](https://dialogflow.com/docs/reference/v2-agent-setup) API. Based on natural conversational experiences with users seeking movie recommendations, the bot passes conversation entities to The Movie Database API and retreives movies for users.

## How it Works
A webhook service is designed to handle all received user messages, via Express routes, from the Facebook Messenger and Dialogflow APIs. The webhook passes off the Messenger request to the Dialogflow API, which interprets the conversation intents & entities. Finally, the resulting entities are queried using The Movie Database API and returned to the webhook, which sends generated responses back to Messenger.

## Prerequisites
* Facebook Developer Account & FB Page for Bot
* Google Cloud Account & Application Credentials 
* The Movie Database API Key

## Usage
Install all local dependencies from `package.json` by executing the following:
```
npm install
```

To spin up the webhook server, navigate to the directory where `webhook.js` exists and excute the following:
```
node webhook.js 
```
Note: The server listens on any specified port, or PORT 3000 by default.

## APIs Used
* Facebook Messenger V2.6
* Google Cloud Dialogflow V2
* The Movie Database V3

## Node Modules Required
* [Body-Parser](https://www.npmjs.com/package/body-parser): For parsing incoming request bodies
* [Config](https://www.npmjs.com/package/config): For configuring Node.js application
* [Dialogflow](https://www.npmjs.com/package/dialogflow): For creating natural conversational experiences with users
* [Express](https://www.npmjs.com/package/express): For designing the webhook
* [Request-Promise](https://www.npmjs.com/package/request-promise): For simplistic HTTP requests with Promise support

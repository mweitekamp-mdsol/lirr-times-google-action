'use strict';

const functions = require('firebase-functions');
const {WebhookClient} = require('dialogflow-fulfillment');
const {Card, Suggestion} = require('dialogflow-fulfillment');
const axios = require('axios');
var GEO_CITY = "geo-city";
var STATION = "station";

process.env.DEBUG = 'dialogflow:debug'; // enables lib debugging statements

exports.dialogflowFirebaseFulfillment = functions.https.onRequest((request, response) => {
  const agent = new WebhookClient({ request, response });
  console.log('Dialogflow Request headers: ' + JSON.stringify(request.headers));
  console.log('Dialogflow Request body: ' + JSON.stringify(request.body));

  function welcome(agent) {
    agent.add(`Welcome! I like trains.`);
    agent.add(`Choo choo mother lover.`);
  }

  function fallback(agent) {
    agent.add(`I didn't understand`);
    agent.add(`I'm sorry, can you try again?`);
  }

  function getCityCode(city_name) {
    // yes, this is gross but I have 1000 API calls a month
    const station_code_dict = {'Douglaston': 'DGL', 'Mastic Shirley': 'MSY', 'Mattituck': 'MAK', 'Stewart Manor': 'SMR',
    'Syosset': 'SYT', 'Islip': 'ISP', 'Glen Head': 'GHD', 'Port Washington': 'PWS', 'Massapequa Park': 'MPK',
    'Carle Place': 'CPL', 'Hunterspoint Avenue': 'HPA', 'Patchogue': 'PGE', 'Island Park': 'IPK', 'Inwood': 'IWD',
    'Penn Station': 'NYK', 'Glen Cove': 'GCV', 'Lakeview': 'LVW', 'Auburndale': 'ADL', 'Locust Valley': 'LVL',
    'St. Albans': 'SAB', 'Atlantic Terminal': 'ATL', 'Sayville': 'SVL', 'Glen Street': 'GST', 'Hewlett': 'HWT',
    'Montauk': 'MTK', 'Nostrand Avenue': 'NAV', 'Laurelton': 'LTN', 'Bay Shore': 'BSR', 'East Rockaway': 'ERY',
    'Woodmere': 'WMR', 'Baldwin': 'BWN', 'Greenvale': 'GVL', 'Hempstead Gardens': 'HGN', 'Rosedale': 'ROS',
    'Farmingdale': 'FMD', 'Valley Stream': 'VSM', 'Queens Village': 'QVG', 'Forest Hills': 'FHL', 'Medford': 'MFD',
    'Jamaica': 'JAM', 'Murray Hill': 'MHL', 'Lynbrook': 'LYN', 'Locust Manor': 'LMR', 'East Williston': 'EWN',
    'Belmont': 'BRT', 'Greenlawn': 'GWN', 'Greenport': 'GPT', 'Long Beach': 'LBH', 'Bethpage': 'BPG',
    'Plandome': 'PDM', 'Kings Park': 'KPK', 'Roslyn': 'RSN', 'Broadway': 'BDY', 'Westwood': 'WWD', 'Bellmore': 'BMR',
    'Great River': 'GRV', 'Oyster Bay': 'OBY', 'Albertson': 'ABT', 'Bayside': 'BSD', 'Merillon Avenue': 'MAV',
    'Mineola': 'MIN', 'Port Jefferson': 'PJN', 'Hampton Bays': 'HBY', 'Wyandanch': 'WYD', 'East New York': 'ENY',
    'Smithtown': 'STN', 'Cedarhurst': 'CHT', 'Cold Spring Harbor': 'CSH', 'West Hempstead': 'WHD',
    'Sea Cliff': 'SCF', 'Babylon': 'BTA', 'Malverne': 'MVN', 'Speonk': 'SPK', 'Meadowlands': 'MDW', 'Stony Brook': 'BK',
    'Woodside': 'WDD', 'Brentwood': 'BWD', 'Oceanside': 'ODE', 'Bridgehampton': 'BHN', 'Floral Park': 'FPK',
    'Country Life Press': 'CLP', 'St. James': 'SJM', 'Northport': 'NPT', 'Flushing Main Street': 'FLS',
    'Ronkonkoma': 'RON', 'Bellerose': 'BRS', 'Merrick': 'MRK', 'Westhampton': 'WHN', 'Garden City': 'GCY',
    'Amityville': 'AVL', 'Copiague': 'CPG', 'Far Rockaway': 'FRY', 'Long Island City': 'LIC', 'Southampton': 'SHN',
    'Great Neck': 'GNK', 'Hicksville': 'HVL', 'Riverhead': 'RHD', 'Central Islip': 'CI', 'Freeport': 'FPT',
    'Rockville Centre': 'RVC', 'Pinelawn': 'PLN', 'Hollis': 'HOL', 'Massapequa': 'MQA', 'Little Neck': 'LNK',
    'Deer Park': 'DPK', 'Oakdale': 'ODL', 'Gibson': 'GBN', 'Amagansett': 'AGT', 'Nassau Boulevard': 'NBD',
    'Hempstead': 'HEM', 'East Hampton': 'EHN', 'Mets-Willets Point': 'SSM', 'Westbury': 'WBY', 'Bellport': 'BPT',
    'Lindenhurst': 'LHT', 'Wantagh': 'WGH', 'Seaford': 'SFD', 'Lawrence': 'LCE', 'Southold': 'SHD',
    'Yaphank': 'YPK', 'Huntington': 'HUN', 'Centre Avenue': 'CAV', 'Manhasset': 'MHT', 'Kew Gardens': 'KGN',
    'New Hyde Park': 'NHP'};

    let city_code = station_code_dict[city_name];
    return city_code;
  }
  

  function trainTime(agent) {
    var geo_city = agent.parameters[GEO_CITY];
    var station = agent.parameters[STATION];
    if (geo_city || station) {
      let stop = geo_city || station;
          
      let d = new Date();
      let year = d.getFullYear();
      let month = d.getMonth() + 1;
      let day = d.getDate();
      let hour = d.getHours() - 4;
      let minute = d.getMinutes();
      
      let city_code = getCityCode(stop);
      let url = 'https://traintime.lirr.org/api/TrainTime?month=' + month + '&day=' + day + '&year=' + year + '&hour=' + hour + '&minute=' + minute + '&datoggle=d&endsta=NYK&startsta=' + city_code + '&mymta=1';
      console.log(url);
      
      return axios.get(url).then(res => {
        var depart_time = '';
        for (let i = 0; i < res.data.TRIPS.length; i++) {
          if (res.data.TRIPS[i].LEGS[0].STATUS != 'Left Station') {
            depart_time = res.data.TRIPS[i].LEGS[0].STOPS[0].TIME;
            break;
          }
        }
        var bot_response = "The next train from " + stop + " to Penn leaves at " + depart_time + ".";
        agent.add(bot_response);
      }).catch(error => {
        console.log(error);
        agent.add("Uh-oh, there's an error in my code. It's not you, it's me.");
      });
    } else {
      agent.add("From what station?");
    }
  }


  // // Uncomment and edit to make your own intent handler
  // // uncomment `intentMap.set('your intent name here', yourFunctionHandler);`
  // // below to get this function to be run when a Dialogflow intent is matched
  // function yourFunctionHandler(agent) {
  //   agent.add(`This message is from Dialogflow's Cloud Functions for Firebase editor!`);
  //   agent.add(new Card({
  //       title: `Title: this is a card title`,
  //       imageUrl: 'https://developers.google.com/actions/images/badges/XPM_BADGING_GoogleAssistant_VER.png',
  //       text: `This is the body text of a card.  You can even use line\n  breaks and emoji! 💁`,
  //       buttonText: 'This is a button',
  //       buttonUrl: 'https://assistant.google.com/'
  //     })
  //   );
  //   agent.add(new Suggestion(`Quick Reply`));
  //   agent.add(new Suggestion(`Suggestion`));
  //   agent.setContext({ name: 'weather', lifespan: 2, parameters: { city: 'Rome' }});
  // }

  // // Uncomment and edit to make your own Google Assistant intent handler
  // // uncomment `intentMap.set('your intent name here', googleAssistantHandler);`
  // // below to get this function to be run when a Dialogflow intent is matched
  // function googleAssistantHandler(agent) {
  //   let conv = agent.conv(); // Get Actions on Google library conv instance
  //   conv.ask('Hello from the Actions on Google client library!') // Use Actions on Google library
  //   agent.add(conv); // Add Actions on Google library responses to your agent's response
  // }
  // // See https://github.com/dialogflow/dialogflow-fulfillment-nodejs/tree/master/samples/actions-on-google
  // // for a complete Dialogflow fulfillment library Actions on Google client library v2 integration sample

  // Run the proper function handler based on the matched Dialogflow intent name
  let intentMap = new Map();
  intentMap.set('Default Welcome Intent', welcome);
  intentMap.set('Default Fallback Intent', fallback);
  intentMap.set('NEXT_TRAIN_INTENT', trainTime);
  // intentMap.set('your intent name here', googleAssistantHandler);
  agent.handleRequest(intentMap);
});
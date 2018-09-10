// The Cloud Functions for Firebase SDK to create Cloud Functions and setup triggers.
const functions = require('firebase-functions');

// The Firebase Admin SDK to access the Firebase Realtime Database.
const admin = require('firebase-admin');

admin.initializeApp();

// Take the text parameter passed to this HTTP endpoint and insert it into the
// Realtime Database under the path /messages/:pushId/original
/*exports.addMessage = functions.https.onRequest((req, res) => {
  // Grab the text parameter.
  const original = req.query.text;
  // Push the new message into the Realtime Database using the Firebase Admin SDK.
  return admin.database().ref('/messages').push({original: original}).then((snapshot) => {
    // Redirect with 303 SEE OTHER to the URL of the pushed object in the Firebase console.
    return res.redirect(303, snapshot.ref.toString());
  });
});*/

var building_info = null
var seismicDesign = null // 내진설계여부
var address = null
var safetyInfo =null
var minMeter = 100 // 10meter
const haversine = require('haversine') 
var ref2 = admin.database().ref('building_info');
ref2.once("value", function(snapshot){
  building_info = snapshot.val()
})
exports.noti = functions.database.ref('/UserLocation/{UID}/{pushId}/')
    .onCreate((snapshot, context) => {
      
      // Grab the current value of what was written to the Realtime Database.
      const original = snapshot.val();
      //console.log('Uppercasing', context.params.UID, context.params.pushId, original);
      //console.log(haversine(start, end, {unit: 'meter'}))
      const start = {
        latitude: original.latitude,
        longitude: original.longitude
      }
      
      var end = {
        latitude: null,
        longitude: null
      }
      
      var tmp = {
        latitude: null,
        longitude: null
      }
      
      var ref = admin.database().ref(`Users/${context.params.UID}/playerId`);
      
      for(x in building_info){    
        //console.log(x['EPSG_4326_Y'] + " / " + tmp['longitude'])
        tmp['latitude'] = building_info[x]['EPSG_4326_Y']
        tmp['longitude'] = building_info[x]['EPSG_4326_X']
        var result = haversine(start, tmp, {unit: 'meter'})
        //console.log("내진설계여부 : " + result + "/" + minMeter)
        //console.log(result < minMeter)
        if(result < minMeter){
          minMeter = result
          end['latitude'] = tmp['latitude']
          end['longitude'] = tmp['longitude']
          seismicDesign = building_info[x]['내진설계여부']
          address = building_info[x]['주소']
          //console.log(minMeter)
        }
      }
      
      if(seismicDesign === 'O'){
        safetyInfo = "되어있음"
      } else if(seismicDesign === 'X'){
        safetyInfo = "되어있지않음"
      } else if(seismicDesign == null){
        seismicDesign = seismicDesign // 넌너고 난나야
      }else{
        safetyInfo = "정보없음"
      } 
      console.log("최소 거리 : " + minMeter)
      return ref.once("value", function(snapshot){
          if(seismicDesign != null){
            const payload = {
              notification: {
                title: '들어온 시간 : ' + original.createdTime  ,
                body: '내진설계 여부 :' + safetyInfo + '\n자세한 건물 정보를 보려면 탭하세요.'+ "\n" + address
              }
            };
            //console.log(snapshot.val())
            admin.messaging().sendToDevice(snapshot.val(), payload)
          }
        },
        function (errorObject) {
            console.log("The read failed: " + errorObject.code);
      });
    });


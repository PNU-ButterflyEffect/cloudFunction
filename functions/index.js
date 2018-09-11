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
var minMeter = 1000 // 10meter

const haversine = require('haversine') 
var sleep = require('system-sleep');
var ref2 = admin.database().ref('building_info');
ref2.once("value", function(snapshot){
  building_info = snapshot.val()
})
exports.pushNoti = functions.database.ref('/UserLocation/{UID}/{pushId}/')
    .onCreate((snapshot, context) => {
      
      // Grab the current value of what was written to the Realtime Database.
      //const original = snapshot.val(); // snapshot is unstable
      console.log(context.params.UID)
      console.log(context.params.pushId)
      console.log("soicem : " + snapshot.val())
      console.log("sleep now")
      sleep(500); // 0.5 seconds
      var newLocationRef1 = admin.database().ref('UserLocation/' + context.params.UID + '/' + context.params.pushId);
      newLocationRef1.once("value", function(snapshot){console.log(snapshot.val())})
      var newLocationRef = admin.database().ref('UserLocation/' + context.params.UID + '/' + context.params.pushId);
      newLocationRef.once("value", function(snapshot){
        original = snapshot.val()
        console.log(original)
        console.log(context)
      
      
      //console.log('Uppercasing', context.params.UID, context.params.pushId, original);
      //console.log(haversine(start, end, {unit: 'meter'}))
        const start = {
          latitude: original.latitude,
          longitude: original.logitude
        }
        //console.log(start)
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
          //console.log(tmp)
          //console.log(start)
          var result = haversine(start, tmp, {unit: 'meter'})
          //console.log(result)
          //console.log("내진설계여부 : " + result + "/" + minMeter)
          //console.log(result < minMeter)
          //console.log(result)
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
          safetyInfo = "내진설계가 되어있습니다."
        } else if(seismicDesign === 'X'){
          safetyInfo = "내진설계가 되어있지않습니다."
        }else{
          safetyInfo = "정보없음"
        } 

        console.log("최소 거리 : " + minMeter + safetyInfo)
        console.log(original.createdTime)
        console.log(original)
        console.log(address)
        return ref.once("value", function(snapshot){
            if(safetyInfo != null){
              const payload = {
                notification: {
                  title: '들어온 시간 : ' + original.createdTime  ,
                  body: safetyInfo + '\n자세한 건물 정보를 보려면 탭하세요.'+ "\n" + address.split('/')[1]
                }
              };
              //console.log(snapshot.val())
              admin.messaging().sendToDevice(snapshot.val(), payload)
            }
          },
          function (errorObject) {
              console.log("The read failed: " + errorObject.code);
        });
      })
      /*var ref = firebase.database().ref("dinosaurs");
      ref.orderByKey().on("child_added", function(snapshot) {
        console.log(snapshot.key);
      });*/
      return 0
    });


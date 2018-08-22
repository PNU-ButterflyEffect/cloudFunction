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

// Listens for new messages added to /messages/:pushId/original and creates an
// uppercase version of the message to /messages/:pushId/uppercase
exports.noti = functions.database.ref('/UserLocation/{UID}/{pushId}/')
    .onCreate((snapshot, context) => {
      // Grab the current value of what was written to the Realtime Database.
      const original = snapshot.val();
      //console.log('Uppercasing', context.params.UID, context.params.pushId, original);
      const uppercase = "100";
  
      var ref = admin.database().ref(`Users/${context.params.UID}/playerId`);
      var safetyInfo = "되어있음"
      var enteredTime = "~"
      return ref.once("value", function(snapshot){
      
          const payload = {
                notification: {
                  title: '들어온 시간 : ' + enteredTime,
                  body: '내진설계 여부 :' +safetyInfo + '\n자세한 건물 정보를 보려면 탭하세요.'
                }
              };
              console.log(snapshot.val())
              admin.messaging().sendToDevice(snapshot.val(), payload)
      
              },
          function (errorObject) {
              console.log("The read failed: " + errorObject.code);
      });
      return snapshot.ref.child('date').set(uppercase);
    });


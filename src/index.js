var FirebaseAdmin = require("firebase-admin");

/**
 * The Botkit firebase driver
 *
 * @param {Object} config This must contain a `firebase_uri` property
 * @returns {{teams: {get, save, all}, channels: {get, save, all}, users: {get, save, all}}}
 */
module.exports = function(config) {
  if (!config || !config.firebase_uri) {
    throw new Error("firebase_uri is required.");
  }

  // var serviceAccount = require(config.firebase_path);
  var serviceAccount = JSON.parse(config.firebase_json);

  // Initialize the app with a service account, granting admin privileges
  FirebaseAdmin.initializeApp({
    credential: FirebaseAdmin.credential.cert(serviceAccount),
    databaseURL: config.firebase_uri
  });

  // As an admin, the app has access to read and write all data, regardless of Security Rules
  var rootRef = FirebaseAdmin.database().ref(),
    teamsRef = rootRef.child("teams"),
    usersRef = rootRef.child("users"),
    channelsRef = rootRef.child("channels");

  return {
    teams: {
      get: get(teamsRef),
      save: save(teamsRef),
      all: all(teamsRef)
    },
    channels: {
      get: get(channelsRef),
      save: save(channelsRef),
      all: all(channelsRef)
    },
    users: {
      get: get(usersRef),
      save: save(usersRef),
      all: all(usersRef)
    }
  };
};

/**
 * Given a firebase ref, will return a function that will get a single value by ID
 *
 * @param {Object} firebaseRef A reference to the firebase Object
 * @returns {Function} The get function
 */
function get(firebaseRef) {
  return function(id, cb) {
    firebaseRef.child(id).once("value", success, cb);

    function success(records) {
      cb(null, records.val());
    }
  };
}

/**
 * Given a firebase ref, will return a function that will save an object. The object must have an id property
 *
 * @param {Object} firebaseRef A reference to the firebase Object
 * @returns {Function} The save function
 */
function save(firebaseRef) {
  return function(data, cb) {
    var firebase_update = {};
    firebase_update[data.id] = data;
    firebaseRef.update(firebase_update, cb);
  };
}

/**
 * Given a firebase ref, will return a function that will return all objects stored.
 *
 * @param {Object} firebaseRef A reference to the firebase Object
 * @returns {Function} The all function
 */
function all(firebaseRef) {
  return function(cb) {
    firebaseRef.once("value", success, cb);

    function success(records) {
      var results = records.val();

      if (!results) {
        return cb(null, []);
      }

      var list = Object.keys(results).map(function(key) {
        return results[key];
      });

      cb(null, list);
    }
  };
}

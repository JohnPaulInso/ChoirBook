// (2026-07-13) export window.db and databaseURL; prev: internal init only
window.__FIREBASE_CONFIG__ = {
  apiKey: "AIzaSyD-Pb2Zomqvx7i24zgGBWEA5eWk53FqbZI",
  authDomain: "choirbook-2317.firebaseapp.com",
  databaseURL: "https://choirbook-2317-default-rtdb.firebaseio.com",
  projectId: "choirbook-2317",
  storageBucket: "choirbook-2317.firebasestorage.app",
  messagingSenderId: "303741150656",
  appId: "1:303741150656:web:28b0d2233a5b2c569d9425",
  measurementId: "G-90NXDTJHQX"
};

window.__FIREBASE_CONFIGURED__ = true;

if (typeof firebase !== 'undefined') {
  firebase.initializeApp(window.__FIREBASE_CONFIG__);
  if (firebase.firestore) {
    window.db = firebase.firestore();
    window.db.enablePersistence({synchronizeTabs: true}).catch(function(){});
  }
}
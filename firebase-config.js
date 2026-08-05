// (2026-07-13) Set real choirbook-2317 config with offline persistence enabled; prev: basic initializeApp
window.__FIREBASE_CONFIG__ = {
  apiKey: "AIzaSyD-Pb2Zomqvx7i24zgGBWEA5eWk53FqbZI",
  authDomain: "choirbook-2317.firebaseapp.com",
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
    firebase.firestore().enablePersistence({synchronizeTabs: true}).catch(function(){});
  }
}
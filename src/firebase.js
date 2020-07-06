import { user, page } from './stores'
import Profile from './components/Profile.svelte'

import firebase from 'firebase/app'
import 'firebase/auth'
import 'firebase/firestore'

const firebaseConfig = {
  apiKey: 'AIzaSyAkXWbfEydMfb6_uH-6FiiJHtMsM2F4mfo',
  authDomain: 'ako-tutor.firebaseapp.com',
  databaseURL: 'https://ako-tutor.firebaseio.com',
  projectId: 'ako-tutor',
  storageBucket: 'ako-tutor.appspot.com',
  messagingSenderId: '1006098927451',
  appId: '1:1006098927451:web:382cec1ed4ac6a11ad147e'
}

firebase.initializeApp(firebaseConfig)

const auth = firebase.auth()
const googleProvider = new firebase.auth.GoogleAuthProvider()
const db = firebase.firestore()

/* Signup
 * Logs the user into the provider with a pop-up, then
 * Updates the local user variable with the details from the login, then
 * Writes the user's email to the database to create a new user, then
 * Redirects to the Profile page.
 */
export async function signup() {
  // login
  let loginData = await auth.signInWithPopup(googleProvider)

  // update the user store
  user.set({
      uid: loginData.user.uid,
      email: loginData.user.email
    })

  // write user to database
  db.collection('users').doc(loginData.user.uid).set({
      email: loginData.user.email
    })

  // redirect to the profile page
  page.set(Profile)
}

/* Login
 * Logs the user into the provider with a pop-up, then
 * Updates the local user variable with the details from the database, then
 * Redirects to the Profile page.
 */
export async function login() {
  // get the user's data from the login information
  let loginData = await auth.signInWithPopup(googleProvider)
  let userRef = await db.collection('users').doc(loginData.user.uid).get()
  let userData = userRef.data()
  
  // get the school name from the reference in the user data
  if (userData.school) {
    let schoolRef = await userData.school.get()
    let schoolData = schoolRef.data()
    userData.school = schoolData.name
  }

  // get the subjects the user has opted to tutor in
  if (userData.subjects) {

  }

  // update the user store
  user.set({
      uid: loginData.user.uid, ...userData
    })

  // redirect to the profile page
  page.set(Profile)
}

/* Logout
 * Signs the user our of their provider login, then
 * redirects to the home page, then
 * unloads the user information from the local user variable.
 */
export function logout() {
  auth.signOut()
  page.set(undefined)
  user.set(undefined)
}

/* Update Profile
 * Overwrites the data in the database with the data in the local user variable.
 */
export function updateProfile() {
  db.collection('users').doc(user.uid).update({
      firstName: user.firstName,
      lastName: user.lastName,
    })
}

/* Get All Subjects
 * Returns a Map of the subjects with the key:value pairs as level:[subjects].
 */
export async function getAllSubjects() {
  let subjectsMap = new Map()

  // get all the subject documents from the database
  let allSubjectsRef = await db.collection('subjects').get()
  
  // create a map with level as the key and array of subjects as value, e.g.
  // key: `Level 1`, value: [ `English`, `Maths`, `Science` ]
  allSubjectsRef.forEach(subjectRef => {
    let subjectData = subjectRef.data()
    subjectsMap.set(subjectRef.id, subjectData.subjects)
  })

  // sort the keys and values (arrays) for display purposes
  subjectsMap = new Map([...subjectsMap.entries()].sort())
  subjectsMap.forEach(level => { level.sort() })

  return subjectsMap
}
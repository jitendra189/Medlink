/* ================================
MedLink Appointment System
Doctor Queue Management Script
================================ */

document.addEventListener("DOMContentLoaded", () => {

const patientQueue = [

{
name: "Rahul Kumar",
turn: "ML-245",
age: "32 years",
condition: "Emergency Consultation",
avatar: "RK"
},

{
name: "Priya Sharma",
turn: "ML-246",
age: "27 years",
condition: "Fever Checkup",
avatar: "PS"
},

{
name: "Amit Verma",
turn: "ML-247",
age: "41 years",
condition: "Blood Pressure Monitoring",
avatar: "AV"
},

{
name: "Neha Gupta",
turn: "ML-248",
age: "36 years",
condition: "General Health Checkup",
avatar: "NG"
},

{
name: "Rakesh Singh",
turn: "ML-249",
age: "50 years",
condition: "Diabetes Follow-up",
avatar: "RS"
}

];

let currentIndex = 0;

/* =============================
DOM ELEMENTS
============================= */

const queueContainer = document.getElementById("patient-queue");

const nameDisplay = document.getElementById("current-patient-name");
const turnDisplay = document.getElementById("current-patient-turn");
const ageDisplay = document.getElementById("current-patient-age");
const conditionDisplay = document.getElementById("current-patient-condition");
const avatarDisplay = document.getElementById("current-patient-avatar");
const turnBigDisplay = document.getElementById("current-turn-display");

/* =============================
RENDER QUEUE
============================= */

function renderQueue(){

queueContainer.innerHTML = "";

patientQueue.forEach((patient, index)=>{

const item = document.createElement("div");

item.className = "queue-item";

item.innerHTML = `

<div class="queue-avatar">${patient.avatar}</div>
<div class="queue-details">
<strong>${patient.name}</strong>
<p>${patient.condition}</p>
</div>
<div class="queue-turn">${patient.turn}</div>
`;if(index === currentIndex){
item.style.background = "#e0f7f5";
}

queueContainer.appendChild(item);

});

}

/* =============================
SHOW CURRENT PATIENT
============================= */

function updateCurrentPatient(){

const patient = patientQueue[currentIndex];

nameDisplay.textContent = patient.name;
turnDisplay.textContent = patient.turn;
ageDisplay.textContent = patient.age;
conditionDisplay.textContent = patient.condition;
avatarDisplay.textContent = patient.avatar;
turnBigDisplay.textContent = patient.turn;

renderQueue();

}

/* =============================
NEXT PATIENT
============================= */

document.getElementById("next-patient-btn").addEventListener("click", () => {

if(currentIndex < patientQueue.length - 1){
currentIndex++;
updateCurrentPatient();
}

});

/* SECOND NEXT BUTTON */

document.getElementById("next-patient-btn-2").addEventListener("click", () => {

if(currentIndex < patientQueue.length - 1){
currentIndex++;
updateCurrentPatient();
}

});

/* =============================
PREVIOUS PATIENT
============================= */

document.getElementById("prev-patient-btn").addEventListener("click", () => {

if(currentIndex > 0){
currentIndex--;
updateCurrentPatient();
}

});

/* =============================
SAVE NOTES BUTTON
============================= */

document.getElementById("save-notes-btn")?.addEventListener("click", ()=>{

alert("MedLink: Consultation notes saved successfully.");

});

/* =============================
COMPLETE VISIT
============================= */

document.getElementById("complete-visit-btn")?.addEventListener("click", ()=>{

alert("Appointment completed and patient record updated.");

});

/* =============================
RESCHEDULE VISIT
============================= */

document.getElementById("reschedule-btn")?.addEventListener("click", ()=>{

alert("Appointment rescheduled in MedLink system.");

});

/* =============================
PRINT REPORT
============================= */

document.getElementById("print-btn")?.addEventListener("click", ()=>{

window.print();

});

/* =============================
PATIENT SCREEN TOGGLE
============================= */

const doctorViewBtn = document.getElementById("doctor-view-btn");
const patientViewBtn = document.getElementById("patient-view-btn");

const doctorView = document.getElementById("doctor-view");
const patientView = document.getElementById("patient-view");

doctorViewBtn.addEventListener("click", ()=>{

doctorView.style.display = "block";
patientView.style.display = "none";

doctorViewBtn.classList.add("active");
patientViewBtn.classList.remove("active");

});

patientViewBtn.addEventListener("click", ()=>{

doctorView.style.display = "none";
patientView.style.display = "block";

patientViewBtn.classList.add("active");
doctorViewBtn.classList.remove("active");

});

/* =============================
SOUND ANNOUNCEMENT
============================= */

const soundToggle = document.getElementById("sound-toggle");

soundToggle.addEventListener("click", ()=>{

const patient = patientQueue[currentIndex];

const message = "Now serving patient ${patient.turn}. ${patient.name}, please proceed to the consultation room.";

const speech = new SpeechSynthesisUtterance(message);

speechSynthesis.speak(speech);

});

/* =============================
INITIAL LOAD
============================= */

updateCurrentPatient();

});
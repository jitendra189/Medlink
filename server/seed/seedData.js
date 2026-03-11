const mongoose = require("mongoose")
const bcrypt = require("bcryptjs")

const User = require("../models/User")
const Hospital = require("../models/Hospital")
const BloodDonor = require("../models/BloodDonor")

require("dotenv").config()

async function seed(){

await mongoose.connect(process.env.MONGO_URI)

console.log("MongoDB Connected")

/* CLEAR OLD DATA */

await User.deleteMany({})
await Hospital.deleteMany({})
await BloodDonor.deleteMany({})

const password = await bcrypt.hash("password123",10)

/* ======================
   CREATE PATIENTS
====================== */

const patients = []

for(let i=1;i<=10;i++){

patients.push({
name:`Patient ${i}`,
email:`patient${i}@mail.com`,
password:password,
role:"patient"
})

}

const createdPatients = await User.insertMany(patients)

console.log("Patients created")

/* ======================
   CREATE HOSPITAL USERS
====================== */

const hospitalsUsers = []

for(let i=1;i<=6;i++){

hospitalsUsers.push({
name:`Hospital Admin ${i}`,
email:`hospital${i}@mail.com`,
password:password,
role:"hospital"
})

}

const createdHospitalUsers = await User.insertMany(hospitalsUsers)

/* ======================
   CREATE HOSPITAL DATA
====================== */

const hospitals = [
{
name:"City Care Hospital",
icuBeds:6,
doctors:15,
city:"Mumbai",
location:{lat:19.076,lng:72.877},
user:createdHospitalUsers[0]._id
},
{
name:"Green Valley Hospital",
icuBeds:4,
doctors:10,
city:"Delhi",
location:{lat:28.613,lng:77.209},
user:createdHospitalUsers[1]._id
},
{
name:"LifeLine Medical Center",
icuBeds:8,
doctors:20,
city:"Bangalore",
location:{lat:12.971,lng:77.594},
user:createdHospitalUsers[2]._id
},
{
name:"Apollo Care",
icuBeds:5,
doctors:14,
city:"Chennai",
location:{lat:13.082,lng:80.270},
user:createdHospitalUsers[3]._id
},
{
name:"Sunrise Hospital",
icuBeds:7,
doctors:18,
city:"Hyderabad",
location:{lat:17.385,lng:78.486},
user:createdHospitalUsers[4]._id
},
{
name:"Metro Health Center",
icuBeds:3,
doctors:12,
city:"Pune",
location:{lat:18.520,lng:73.856},
user:createdHospitalUsers[5]._id
}
]

await Hospital.insertMany(hospitals)

console.log("Hospitals created")

/* ======================
   CREATE DONOR USERS
====================== */

const donorUsers = []

for(let i=1;i<=10;i++){

donorUsers.push({
name:`Donor ${i}`,
email:`donor${i}@mail.com`,
password:password,
role:"donor"
})

}

const createdDonorUsers = await User.insertMany(donorUsers)

/* ======================
   BLOOD DONOR DATA
====================== */

const bloodGroups=["O+","A+","B+","AB+","O-"]

const donors=[]

for(let i=0;i<10;i++){

donors.push({
user:createdDonorUsers[i]._id,
bloodGroup:bloodGroups[i%5],
phone:`98765432${i}`,
available:true,
city:"Mumbai",
location:{
lat:19.07 + (Math.random()/100),
lng:72.87 + (Math.random()/100)
}
})

}

await BloodDonor.insertMany(donors)

console.log("Blood donors created")

console.log("Database seeded successfully")

process.exit()

}

seed()
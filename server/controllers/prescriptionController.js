const PDFDocument = require("pdfkit");
const Appointment = require("../models/Appointment");

exports.generatePrescription = async(req,res)=>{

const appointment = await Appointment.findById(req.params.id);

const doc = new PDFDocument();

res.setHeader("Content-Type","application/pdf");

doc.pipe(res);

doc.fontSize(22).text("MedLink Prescription");

doc.moveDown();

doc.text("Patient: "+appointment.patientName);
doc.text("Age: "+appointment.age);
doc.text("Symptoms: "+appointment.symptoms);

doc.moveDown();

doc.text("Doctor Notes: "+appointment.doctorNotes);

doc.moveDown();

doc.text("Prescription: "+appointment.prescription);

doc.end();

};
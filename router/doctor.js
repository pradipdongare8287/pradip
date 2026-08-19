const express = require('express');
const doctor = express.Router();
const session = require('express-session');
const fileupload = require('express-fileupload')
const query = require('../db.js')
const path = require('path');
const fs = require('fs')


doctor.use(express.static('public'))
doctor.use(express.urlencoded({ extended: true }))
doctor.use(fileupload())
doctor.use(session({
    secret: 'mysecreat',
    resave: false,
    saveUninitialized: true
}))

// ===========================================

function login_ckeck(req, res,next) {
    if (req.session.did && req.session.demail) {
        next();
        
    }
    else {
        res.redirect('/login')
    }
}

// =================================================

// header Data

doctor.use(async(req,res,next)=>{
   var id = req.session.did
   var select_doctor = `select * from doctors where doc_id=?`
   var doctor = await query(select_doctor,[id])

    var user={
        name : doctor[0].doc_name,
        photo : doctor[0].doctor_image
    }
    res.locals.headerData=user
    next();
})




// =========================================================
doctor.get('/', login_ckeck, async (req, res) => {
    var id = req.session.did;
    var doctorname = req.session.dname

    var todays_total_appointments_data  = `select * from peteient_appointment where Doctor=? and Date = DATE_FORMAT(CURDATE(), "%Y-%m-%d") ORDER BY app_id DESC`
    var total_today_appointment = await query(todays_total_appointments_data,[doctorname])

    var today_appointmet = 'select count(*) as today_appointment from peteient_appointment where Doctor=? and Date = DATE_FORMAT(CURDATE(), "%Y-%m-%d")'
    var todays_appointments = await query(today_appointmet,[doctorname])

    var all_pending_appointment = `select count(*) as Pending_appointment from peteient_appointment where Doctor=? and Status=?`
    var pending = await query(all_pending_appointment,[doctorname,'pending'])

    var complete_appointment = `select count(*) as Complete_appointment from peteient_appointment where Doctor=? and Status=?`
    var complete = await query(complete_appointment,[doctorname,'completed'])


    var select = `select * from doctors where doc_id=?`
    var doctor = await query(select, [id])
  
    res.render('doctor/dashboard.ejs', { doctor: doctor[0],pending:pending[0],complete:complete[0],todays_appointments:todays_appointments[0],total_today_appointment:total_today_appointment })

    
})

doctor.get('/profile', login_ckeck,async (req, res) => {
    var id = req.session.did

    var select1 = `select * from doctors where doc_id=?`
    var doctor = await query(select1, [id])

    var select2 = `select * from department`
    var dname = await query(select2)

    // console.log(doctor)
    res.render('doctor/profile.ejs', { doctor: doctor[0], dname: dname })
})


doctor.get('/Patients', login_ckeck,async (req, res) => {
    var doctorname = req.session.dname

    var appointment_patients = `SELECT a.*, c.* FROM peteient_appointment AS a INNER JOIN petient AS c ON a.Petient_id = c.pid WHERE a.Doctor = ? `;


    // var appointment_patients = `select * from peteient_appointment where Doctor=?`
    var patients = await query(appointment_patients, [doctorname])
    res.render('doctor/patients.ejs', { patients: patients })

})



doctor.get('/logout',login_ckeck, (req, res) => {
    req.session.destroy()
    res.redirect('/login')
})



doctor.post('/update_doctor/:img/:id', async (req, res) => {
    var id = req.params.id;
    var oldimg = req.params.img;

    var { d_name, d_phone, d_specialty, d_department, d_gender, d_address, d_discription, d_language, Petient_treated, d_workingday, d_timetable } = req.body;

    if (req.files && req.files.d_photo) {
        var newimg = req.files.d_photo;
        var newnameimg = Date.now() + newimg.name;
        var imglocation = path.join(__dirname, '../', 'public/images', newnameimg)
        newimg.mv(imglocation, (err) => { });

        var oldphoto = path.join(__dirname, '../', 'public/images', oldimg)
        fs.unlink(oldphoto, (err) => { })
    }

    else {
        var newnameimg = oldimg
    }

    var update_doctor = `update doctors set doc_name=?,doc_phone=?,doc_specialty=?,doc_departmentId=?,doc_gender=?,doc_address=?,doc_discription=?,doc_language=?,petient_treat=?,doc_workingday=?,doc_timetable=?,doctor_image=? where doc_id=?`

    var sql = await query(update_doctor, [d_name, d_phone, d_specialty, d_department, d_gender, d_address, d_discription, d_language, Petient_treated, d_workingday, d_timetable, newnameimg, id])

    res.redirect('/doctor/')
})

doctor.get('/appointments',login_ckeck, async (req, res) => {
    var id = req.session.did;
    // req.session.dname = doctor[0].doc_name;
    var doctorname = req.session.dname

    var select2 = `SELECT a.*, c.* FROM peteient_appointment AS a INNER JOIN petient AS c ON a.Petient_id = c.pid WHERE a.Doctor = ? and Status="pending"`;
    var sql2 = await query(select2, [doctorname])
    var select3 = `SELECT a.*, c.* FROM peteient_appointment AS a INNER JOIN petient AS c ON a.Petient_id = c.pid WHERE a.Doctor = ? and Status="reject"`;
    var reject = await query(select3, [doctorname])
    var select4 = `SELECT a.*, c.* FROM peteient_appointment AS a INNER JOIN petient AS c ON a.Petient_id = c.pid WHERE a.Doctor = ? and Status="confirm"`;
    var confirm = await query(select4, [doctorname])
    var select5 = `SELECT a.*, c.* FROM peteient_appointment AS a INNER JOIN petient AS c ON a.Petient_id = c.pid WHERE a.Doctor = ? and Status="completed"`;
    var completed = await query(select5, [doctorname])



    res.render('doctor/appointments.ejs', { data2: sql2, reject: reject, confirm: confirm, completed: completed })

})

doctor.get('/confirm_appoinment/:id', async (req, res) => {
    var id = req.params.id;
    var update = `update peteient_appointment set Status=? where app_id=?`
    var sql = await query(update, ['confirm', id])
    res.redirect('/doctor/appointments')
})
doctor.get('/reject_appoinment/:id', async (req, res) => {
    var id = req.params.id;
    var update = `update peteient_appointment set Status=? where app_id=?`
    var sql = await query(update, ['reject', id])
    res.redirect('/doctor/appointments')


})

doctor.get('/completed_appoinment/:id', async (req, res) => {
    var id = req.params.id;
    var update = `update peteient_appointment set Status=? where app_id=?`
    var sql = await query(update, ['completed', id])

    res.redirect('/doctor/appointments')
})

doctor.get('/patients',login_ckeck, (req, res) => {
    res.render('doctor/patients.ejs')
})
doctor.get('/treatment', async (req, res) => {
    var id = req.session.did;


    var doctorname = req.session.dname

    var select_doctor = `select * from doctors where doc_id=?`
    var select_treatment = `select a.*,b.* from petient as a inner join petient_treatment_complete as  b on a.pname = b.treat_patient_name where b.treat_doc_name=? ORDER BY b.tid DESC LIMIT  5 `;


    var patients = `select * from petient`
    var deta = await query(patients)
    var doctor = await query(select_doctor, [id])
    var treatments_last5 = await query(select_treatment, [doctorname])



    res.render('doctor/treatment.ejs', { deta: deta, doctor: doctor[0], treatments_last5: treatments_last5 })
   

})
doctor.get('/prescription',login_ckeck,async(req, res) => {

    var doctorname = req.session.dname;

    var select_prescription_patient = `select * from prescription where Doc_name=?`
    var select_patient = `select * from petient`
    var doctor = `select * from doctors where doc_name=?`
    
    
    var prescription_patient = await query(select_prescription_patient,[doctorname])
    var patient = await query(select_patient);
    var doctor_name = await query(doctor,[doctorname]);

    var RXNUMBER = Math.floor(1000 + Math.random() * 9000);

    res.render('doctor/prescription.ejs',{patient:patient,doctor_name:doctor_name[0],prescription_patient:prescription_patient,RXNUMBER:RXNUMBER})
   

})

doctor.post('/save_prescription',login_ckeck,async(req,res)=>{
    // res.send(req.body)
    var {patient_name,pre_date,doc_name,pre_diagnosis,medicine,dosage,frequency,duration,pre_advice}=req.body;

    var save_priscription = `insert into prescription(Patient_name,Pre_date,Doc_name,Pre_diagnosis,Pre_advice)values(?,?,?,?,?)`;
    var insert_priscription = await query(save_priscription,[patient_name,pre_date,doc_name,pre_diagnosis,pre_advice]
       
    );

    var return_insert_id = insert_priscription.insertId
    // res.send(return_insert_id)
    for(var i=0;i<medicine.length;i++){
        var insert_medicin = `insert into prescription_medicen(Prescription_id,Medicine,Dosage,Frequency,Duration)values(?,?,?,?,?)`
        var medicin = await query(insert_medicin,[return_insert_id,medicine[i],dosage[i],frequency[i],duration[i]])
        
    }
    res.redirect('/doctor/prescription')
})

doctor.get('/prescription_view/:id',async(req,res)=>{
    id = req.params.id
    var doctor_department = req.session.department
    var select_patient = `select a.*,b.* from prescription As a inner join prescription_medicen as b on a.Prescription_id = b.Prescription_id where a.Prescription_id=?`
    var patient = await query(select_patient,[id])
    
    res.render('doctor/prescription_view.ejs',{patient:patient,doctor_department:doctor_department})
    
})


doctor.get('/reports',login_ckeck,async(req,res) => {
    var id = req.session.did;
    var doctorname = req.session.dname;

    var slelect_doctor = `select * from doctors where doc_id=?`
    var select_patient = `select * from petient`
    var select_reports = `select a.*,b.* from doctors as a inner join patient_report as  b on a.doc_name = b.report_submited_doctor_name where b.report_submited_doctor_name=?`
 


    var doctor = await query(slelect_doctor,[id])
    var patient = await query(select_patient)
    var reports = await query(select_reports,[doctorname])

    res.render('doctor/reports.ejs',{patient:patient,doctor:doctor[0],reports:reports})
    
})
doctor.get('/schedule', (req, res) => {
    res.render('doctor/schedule.ejs')
})

doctor.get('/web_appointments',login_ckeck, async (req, res) => {

    var doctorname = req.session.dname

    var web_appointment = `select * from web_peteint_appointment where status=? and app_doctorname=?`
    var confirm_appintment = `select * from web_peteint_appointment where status=? and app_doctorname=?`
    var complet_appointment = `select * from web_peteint_appointment where status=? and app_doctorname=?`
    var reject_appointment = `select * from web_peteint_appointment where status=? and app_doctorname=?`


    var appointments = await query(web_appointment, ['pending', doctorname]);
    var confirm = await query(web_appointment, ['confirm', doctorname]);
    var complet = await query(complet_appointment, ['complete', doctorname])
    var reject = await query(complet_appointment, ['reject', doctorname])


    res.render('doctor/web_appointments.ejs', { appointments: appointments, confirm: confirm, complet: complet, reject: reject });
    //  console.log(appointments)
})


doctor.get('/confirm_web_appoinment/:id', async (req, res) => {
    var id = req.params.id
    var update_web_appointment = `update web_peteint_appointment set status=? where app_id=?`

    var update = await query(update_web_appointment, ['confirm', id])
    res.redirect('/doctor/web_appointments')
})

doctor.get('/complete_web_appoinment/:id', async (req, res) => {
    var id = req.params.id;
    var complete_web_appointment = `update web_peteint_appointment set status=? where app_id=?`
    var update = await query(complete_web_appointment, ['complete', id])
    res.redirect('/doctor/web_appointments')
})

doctor.get('/reject_web_appoinment/:id', async (req, res) => {
    var id = req.params.id;
    var reject_web_appointment = `update web_peteint_appointment set status=? where app_id=?`
    var update = await query(reject_web_appointment, ['reject', id])
    res.redirect("/doctor/web_appointments")
})


doctor.get('/patients_details/:id', async (req, res) => {
    var id = req.params.id;
    var select_patients_details = `select a.*,c.* from peteient_appointment as a inner join petient as c on a.Petient_id = c.pid where c.pid=? `
    var patients_details = await query(select_patients_details, [id])
    res.render('doctor/patients_details.ejs', { patients_details: patients_details[0] })
    // console.log(patients_details)
})

doctor.post('/save_treatment', async (req, res) => {
    var { treat_patient_name, treat_disease, treat_diagnosis, treat_notes, treat_medicines, treat_nextVisit, treat_doctor_name } = req.body;
    var insert = `insert into petient_treatment_complete(treat_patient_name,treat_condition,treat_diagnosis,treat_notes,treat_medicines,treat_nextVisit,treat_doc_name)values(?,?,?,?,?,?,?)`
    var treatment_save = await query(insert, [treat_patient_name, treat_disease, treat_diagnosis, treat_notes, treat_medicines, treat_nextVisit, treat_doctor_name])

    res.redirect('/doctor/treatment')

})

doctor.post('/save_report',async(req,res)=>{
    var {report_patient_name,report_title,report_date,report_logo,report_Type,report_submited_doctor}=req.body
    // res.send(req.body)
    // res.send(req.files)
    var report = req.files.report_file;
    var file_report_name = Date.now()+report.name

    var file_location = path.join(__dirname,'../','public/pdf',file_report_name)
    report.mv(file_location,(err)=>{})
   
    var insert_report = `insert into patient_report(patient_name,report_title,report_date,report_logo,report_Type,pdf_report,report_submited_doctor_name,report_status)values(?,?,?,?,?,?,?,?)`
    var save_report = await query(insert_report,[report_patient_name,report_title,report_date,report_logo,report_Type,file_report_name,report_submited_doctor,'Ready'])
   
    res.redirect('/doctor/reports')
})


doctor.get('/delete_report/:id',async(req,res)=>{
    var id = req.params.id;
    var delete_patient_report = `delete from patient_report where report_id=?`
    var delete1 = await query(delete_patient_report,[id])
    res.redirect('/doctor/reports')
})


doctor.get('/dawnload_report/:id',async(req,res)=>{
    var id = req.params.id

    var select_report = ` select * from patient_report where report_id=?`
    var report = await query(select_report,[id])

    var file_name  = report[0].pdf_report;

    var file_locatin = path.join(__dirname,'../','public/pdf',file_name)

    res.download(file_locatin)

})

module.exports = doctor;



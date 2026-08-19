const express = require('express');
const patient = express.Router();
const session = require('express-session')
const fileupload = require('express-fileupload')
const path = require('path');
const fs = require('fs')

var query = require('../db.js')



function check_user(req,res,next){
    if(req.session.pid && req.session.pemail){
        next()
    }
    else{
        res.redirect('/login')
        
    } 
}

patient.use(fileupload())
// ===========================================================================================

patient.get('/',check_user,async(req,res)=>{
    var id = req.session.pid;
    // var id = 1
    var selete = `select * from petient where pid=?`
    var petient = await query(selete,[id])

    res.render('patient/dashboard.ejs',{petient:petient[0]})
    // console.log(petient)
})

patient.get('/profile',async(req,res)=>{
    var select = `select * from petient where pid=?`
    var id = req.session.pid;
    // var id =1 
    var petient = await query(select,[id])
    res.render('patient/profile.ejs',{petient:petient[0]})
})

patient.post('/update_profile/:id',async(req,res)=>{
    // res.send(req.body)

    var {p_name,p_email,p_phone,p_dob,p_bloodGroup,p_gender,p_address}=req.body;

    var id = req.params.id;
    var oldimg = req.params.img;

        var new_img = req.files.p_photo;
        var new_name = Date.now()+new_img.name;
        var imglocation = path.join(__dirname,'../','public/images',new_name)
        new_img.mv(imglocation,(err)=>{})
    

    var update = `update petient set pname=? , pemail=? , pphone=? ,p_dob=? , p_bloodgroup=? , p_gender=? , p_address=? ,p_photo=? where pid=?`
    var sql = await query(update,[p_name,p_email,p_phone,p_dob,p_bloodGroup,p_gender,p_address,new_name,id])
   
    res.redirect('/patient/profile')
   
})

patient.get('/appointments',async(req,res)=>{

    var select = `select * from doctors`
    var select2 = `select a.*, d.* from peteient_appointment as a inner join doctors as d on a.Doctor = d.doc_name`;
    var sql2 = await query(select2)

    var sql = await query(select)
    res.render('patient/appointments.ejs',{doctors:sql,data:sql2})
    // res.send(sql2)
    
})

patient.post('/add_appointment',async(req,res)=>{
    var id = req.session.pid;
    var {doctor,date,time,appoi_reason}=req.body;
    var insert =  `insert into peteient_appointment(Doctor,Date,Time,Appointment_Reason,Status,Petient_id,Payment_status)values(?,?,?,?,?,?,?)`
    var book_apoi = await query(insert,[doctor,date,time,appoi_reason,'pending',id,'Pending'])

    res.redirect('/patient/appointments')
    // console.log(id)
})

patient.get('/treatment',async(req,res)=>{

    var pateint_name = req.session.pname


    var select_treatment =`select d.*,p.* from doctors as d inner join petient_treatment_complete as p on d.doc_name = p.treat_doc_name where p.treat_patient_name=? order by p.tid desc`
    
    var all_treatment = await query(select_treatment,[pateint_name])


    res.render('patient/treatment-history.ejs',{all_treatment:all_treatment})

    // console.log(all_treatment)
})

patient.get('/reports',async(req,res)=>{

    var pateint_name = req.session.pname

    var select_report = `select * from patient_report where patient_name=?`

    var report = await query(select_report,[pateint_name])
    res.render('patient/reports.ejs',{report:report})

    // console.log(report)
})

patient.get("/prescriptions",async(req,res)=>{

    var pateint_name = req.session.pname


    var select_prescription = `select d.*,p.* from doctors as d inner join prescription as p on p.Doc_name = d.doc_name where p.Patient_name=? order by p.Prescription_id desc`
    var prescriptin = await query(select_prescription,[pateint_name])
    res.render('patient/prescriptions.ejs',{prescriptin:prescriptin})
    // console.log(prescriptin)
})

patient.get('/payments',async(req,res)=>{

    var id = req.session.pid;


    var select_appointment_and_doctor = `select a.*, d.*  from peteient_appointment as a inner join doctors as d on a.Doctor = d.doc_name where a.Petient_id=? and a.Status='completed' order by a.app_id desc`

    var sql = await query(select_appointment_and_doctor,[id]);

    console.log(sql)

    res.render('patient/payments.ejs',{data:sql})
})

patient.get("/payment_sucess/:id",async(req,res)=>{
        var id = req.params.id;
        var verify_payment = `update peteient_appointment set Payment_status=? where app_id=?`

        var sql = await query(verify_payment,['Paid',id])

        res.redirect('/patient/payments')
})



patient.get('/prescription_view/:prescription_id/:doctor_name',async(req,res)=>{
    var prescription_id = req.params.prescription_id;
    var doctor_namde = req.params.doctor_name

    var medicin = `select p.*,m.* from prescription as p inner join prescription_medicen as m on p.Prescription_id = m.Prescription_id where m.prescription_id=?`
    var select_doctor = `select * from doctors where doc_name=?`
    var prescription = `select * from prescription where Prescription_id=?`


    
    var sql1 = await query(medicin,[prescription_id])
    var sql2 = await query(select_doctor,[doctor_namde])
    var sql3 = await query(prescription,[prescription_id])

    res.render('patient/prescription_view.ejs',{medicin:sql1,select_doctor:sql2[0],prescription:sql3[0]})
})

module.exports=patient;
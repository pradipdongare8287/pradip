const express = require('express');
const web = express.Router();
const session  = require('express-session')

const query = require('../db.js')


web.use(express.urlencoded({extended:true}))
web.use(session({
        secret:'mykey',
        resave:false,
        saveUninitialized:true
}))
// ===========================================================================================================
web.get('/',async(req,res)=>{
    var select1 = `select * from department`
    var select2 = `select * from doctors`
    var select3 = `select * from treatment`


    var department = await query(select1)
    var doctors = await query(select2)
    var treatment = await query(select3)


    // res.send(department)

    res.render('index.ejs',{department:department,doctors:doctors,treatment:treatment})
})

web.get('/about',async(req,res)=>{
    var select = `select * from about_drives`
    var select2 = `select * from about_our_mission`
    var select3 = `select * from about_journey`


    var sel = await query(select)
    var sel2 = await query(select2)
    var sel3 = await query(select3)


    res.render('about.ejs',{drives:sel,mishion:sel2,journey:sel3})
})

web.get('/departments',async(req,res)=>{
    var select1 = `select * from department`
    var department = await query(select1)

    
    res.render('departments.ejs',{department:department})
})

web.get('/doctors',async(req,res)=>{
    var select1 = `select * from department`
    var select2 = `select * from doctors`


    var department = await query(select1)
    var doctor = await query(select2)

    res.render('doctors.ejs',{department:department,doctor:doctor})
})
web.get('/search_doctor',async(req,res)=>{

    var {Doctor_name,Doctor_department_id}=req.query;

    var search_doctor = `select * from doctors where doc_name=?`
    var doctor = await query(search_doctor,[Doctor_name])


    var select1 = `select * from department`
    var department = await query(select1)


    res.render('doctors.ejs',{department:department,doctor:doctor})
    
    console.log(doctor)
})

web.get('/services',async(req,res)=>{
    var select = `select * from web_services`
    var sel = await query(select)
    res.render('services.ejs',{service:sel})
})

web.get('/blog',async(req,res)=>{
    
    var select = `select * from blog`
    var sql = await query(select)
    res.render('blog.ejs',{Blog:sql})
})

web.get('/contact',async(req,res)=>{
    var select1 = `select * from web_contact`
    var select2 = `select * from website_map where mid=1`

    var contact = await query(select1)
    var map = await query(select2)

    res.render('contact.ejs',{contact:contact,map:map[0]})
})

web.get('/login',(req,res)=>{
    res.render('login.ejs')
})

web.get('/forgot_password',(req,res)=>{
    res.render('forgot-password.ejs')
})

web.get('/gallary',(req,res)=>{
    res.render('gallery.ejs')
})

web.get('/testimonials',(req,res)=>{
    res.render('testimonials.ejs')
})

web.get('/treatment',(req,res)=>{
    res.render('treatment.ejs')
})


web.get('/doctor-details/:id',async(req,res)=>{
    var id = req.params.id;
    var select = `select * from doctors where doc_id=?`
    var doctors1 = await query(select,[id])
     
    console.log(doctors1)
    res.render('doctor-details.ejs',{doctors:doctors1[0]})
})

web.post('/chack_login',async(req,res)=>{
    var {email,password}=req.body
    var select = `select * from doctors where doc_email=? and doc_password=?`
    var doctor = await query(select,[email,password]);

    var select = `select * from petient where pemail=? and ppassword=?`
    var petient = await query(select,[email,password]);
    
    if(doctor[0]){
        req.session.did = doctor[0].doc_id;
        req.session.dname = doctor[0].doc_name;
        req.session.demail = doctor[0].doc_email;
        req.session.department = doctor[0].doc_departmentId;

        res.redirect('/doctor')
    }
    else if(petient[0]){
        req.session.pid = petient[0].pid;
        req.session.pemail = petient[0].pemail;
        req.session.pname = petient[0].pname;

        res.redirect('/patient')
        
    }
    else{
        res.render('recordnot-found.ejs')
    }
})

web.get('/register',(req,res)=>{
    res.render('register.ejs')
})  

web.post('/ragister_petient',async(req,res)=>{
    var {name,email,phone,password,confirmPassword}=req.body;

    var select = `select * from petient where pemail=? `
    var sql = await query(select,[email])

    if(sql[0]){
        res.render('existing-user.ejs')
    }
    else{
        var insert = `insert into petient (pname,pemail,pphone,ppassword,repassword)values(?,?,?,?,?)`
        var patient = await query(insert,[name,email,phone,password,confirmPassword])
        res.redirect('/login')
    }
})

 web.get('/appointment',async(req,res)=>{
    var doctors = `select * from doctors`
    var department = `select * from department`

    var sql1 = await query(doctors);
    var sql2 = await query(department)

    res.render('appointment.ejs',{doctors:sql1,department:sql2})
 })
                    
web.post('/Web_appointment_petient',async(req,res)=>{
    var {app_patientName,app_phone,app_email,app_departmentname,app_doctorname,app_date,app_reason,app_time}=req.body
    var add_web_petient = `insert into web_peteint_appointment(app_patientName,app_phone,app_email,app_departmentname,app_doctorname,app_date,app_time,app_reason,status)values(?,?,?,?,?,?,?,?,?)`
    var add_petient = await query(add_web_petient,[app_patientName,app_phone,app_email,app_departmentname,app_doctorname,app_date,app_time,app_reason,'pending'])
    
    res.redirect('/appointment')
})
module.exports=web;


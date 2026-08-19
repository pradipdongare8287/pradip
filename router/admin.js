const express = require('express');
const admin = express.Router();
const session = require('express-session');
const fileupload = require('express-fileupload');
const path = require('path');
const fs = require('fs')




const query=require('../db.js');
admin.use(express.urlencoded({extended:true}))
admin.use(fileupload())


admin.use(session({
    secret:'Mysecreatekey',
    resave:false,
    saveUninitialized:true
}));

// =================Login Varification================================


    function login_check(req,res,next){
        if(req.session.email && req.session.password){
            next()
        }
        else(
            res.redirect('/admin/login')
        )
    }



admin.post('/save_login',async(req,res)=>{
    var {email,password}=req.body;
    var select = `select * from admin_login where email=? and password=?`
    var sel = await query(select,[email,password]);

    // res.send(sel)

    if(sel[0]){
        req.session.email = sel[0].email;
        req.session.password = sel[0].password;
        res.redirect('/admin/dashboard')
    }
    else{
        res.redirect('/admin/login')
    }

})


admin.get('/',(req,res)=>{
    res.render('admin/login.ejs')
})

admin.get('/login',(req,res)=>{
    res.render('admin/login.ejs')
})

admin.get('/dashboard',login_check,(req,res)=>{
    res.render('admin/dashboard.ejs')
})

admin.get('/doctors',async(req,res)=>{
     var select = `select * from department`
     var doctors = `select * from doctors`

    var sel = await query(select)
    var sel2 = await query(doctors)
    res.render('admin/doctors.ejs',{data:sel,doctors:sel2})
      
})

admin.get('/patients',async(req,res)=>{
    var select_patients = `select * from petient`
    var patient = await query(select_patients)
    res.render('admin/patients.ejs',{patient:patient})
})

admin.post('/update_patient/:img/:id',async(req,res)=>{
    var id = req.params.id;
    var old_patient_img = req.params.img;

    var address = req.body.Patient_Address.replace(/\r?\n|\r/g, " ").trim();

    var {pname,pemail,pphone,ppassword,Patient_dob,Patient_Blood_group,Patient_Gender,Patient_Status}=req.body;
    
    if(req.files && req.files.Patient_Photo){
        var new_patient_img = req.files.Patient_Photo;
        var imgname = Date.now()+new_patient_img.name;
        var imgsavelocation = path.join(__dirname,'../','public/images',imgname);

        new_patient_img.mv(imgsavelocation,(err)=>{})

        var delete_old_img = path.join(__dirname,'../',public/images,old_patient_img)    
    }
    else{
        var imgname = old_patient_img
    }

    var update_patient = `update petient set pname=?,pemail=?,pphone=?,ppassword=?,repassword=?,p_dob=?,p_bloodgroup=?,p_gender=?,p_address=?,p_photo=?,Patient_Status=? where pid=?`
    var update = await query(update_patient,[pname,pemail,pphone,ppassword,ppassword,Patient_dob,Patient_Blood_group,Patient_Gender,address,imgname,Patient_Status,id])
    
    res.redirect('/admin/patients')
})

admin.get('/delete_patient/:id',async(req,res)=>{
    var id = req.params.id;
    var delete_patient = `delete from petient where pid=?`;
    var del = await query(delete_patient,[id]);
    res.redirect('/admin/patients');
})

admin.get('/edit_patient/:id',async(req,res)=>{
    var id = req.params.id;
    var selete_patient = `select * from petient where pid=?`;
    var patient = await query(selete_patient,[id]);
    res.render('admin/edit_patient.ejs',{patient:patient[0]});
})

admin.get('/appoinments',(req,res)=>{
    res.render('admin/appointments.ejs')
})

admin.get('/departments',async(req,res)=>{
    var select = `select * from department`
    var sel = await query(select)
    res.render('admin/departments.ejs',{data:sel})
})

admin.get('/treatments',async(req,res)=>{
    var select = `select * from treatment`;
    var select2 =`select * from department`;
    var sel2 = await query(select2)
    var sel = await query(select)
    res.render('admin/treatments.ejs',{data:sel,department:sel2})
})

admin.get('/medicines',(req,res)=>{
    res.render('admin/medicines.ejs')
})

admin.get('/reports',async(req,res)=>{
    var patient_appointments = `select p.*,d.*,pa.* from peteient_appointment as p inner join doctors as d on p.Doctor = d.doc_name inner join petient as pa on p.Petient_id = pa.pid`
   
    var all_appointments = await query(patient_appointments);
    console.log(all_appointments)
    res.render('admin/reports.ejs',{all_appointments:all_appointments})
})

admin.get('/settings',(req,res)=>{
    res.render('admin/settings.ejs')
})

admin.get('/logout',(req,res)=>{
    req.session.destroy();
    res.redirect('/admin/login')
})

// ===========================DEPARTMENT CRUD===========================================

admin.post('/save_department',async(req,res)=>{
   var {name,icon,image,beds,description,doctor}=req.body;
   var insert = `insert into department(dname,icon,image,beds,description,doctor)values(?,?,?,?,?,?)`
   var ins = await query(insert,[name,icon,image,beds,description,doctor])
   res.redirect('/admin/departments')


})

admin.get('/delete_department/:id',async(req,res)=>{
    var id = req.params.id;
    var delete1 = `delete from department where did=?`
    var del = await query(delete1,[id]);
    res.redirect('/admin/departments')
})

admin.get('/edit_department/:id',async(req,res)=>{
    var id = req.params.id;
    var select =  `select * from department where did=?`
    var sel = await query(select,[id]);
    res.render('admin/departments_edit.ejs',{deta:sel[0]})
})

admin.post('/update_department/:id',async(req,res)=>{
    var {name,icon,image,doctor,beds,description}=req.body;
    var id = req.params.id;

    var update = `update department set dname=?,icon=?,image=?,beds=?,description=?,doctor=? where did=?`
    var up = await query(update,[name,icon,image,beds,description,doctor,id]);
    res.redirect('/admin/departments')
})

// ===========================TREATMENT DEPARTMENT========================================================

admin.post('/addtreatment',async(req,res)=>{
    var {name,department,duration,price,description}=req.body;
    var img = req.files.timage;
    var niname = Date.now()+img.name;
    var imgpath =path.join(__dirname,'../','public/images',niname)
    img.mv(imgpath,(err)=>{})
    // res.send(imgpath)
    var insert = `insert into treatment(tname,department,duration,price,description,Images)values(?,?,?,?,?,?)`
    var ins = await query(insert,[name,department,duration,price,description,niname]);
    res.redirect('/admin/treatments')
})

admin.get('/delete_treatment/:id',async(req,res)=>{
    var id = req.params.id;
    var delete1 = `delete from treatment where tid=?`
    var del = await query(delete1,[id]);
    res.redirect('/admin/treatments')
})

admin.get('/edit_treattment/:id',async(req,res)=>{
    var id = req.params.id;
    var select = `select * from treatment where tid=?`
    var sel = await query(select,[id]);
    res.render('admin/treatment_edit.ejs',{data:sel[0]})
    // res.send(sel)
})

admin.post('/update_treatment/:id/:img',async(req,res)=>{
    var id = req.params.id;
    var oldimg = req.params.img;

    // res.send(oldimg)

    if(req.files && req.files.nimage){
        var newimg = req.files.nimage;
        var newname = Date.now()+newimg.name;
        var imgpath = path.join(__dirname,'../','public/images',newname)
        newimg.mv(imgpath,(err)=>{});

        var oldi = path.join(__dirname,'../','public/images',oldimg)
        fs.unlink(oldi,(err)=>{})
    }
    else{
       var newname = oldimg
    }
    var {name,department,duration,price,description}=req.body;

    var update = `update treatment set tname=?,department=?,duration=?,price=?,description=?,Images=? where tid=?`
    var up = await query(update,[name,department,duration,price,description,newname,id])
    // res.send(up)
    res.redirect('/admin/treatments')
})


// ==========================DOCTOR DEPARTMENT=============================================================================


admin.post('/doctor_save',async(req,res)=>{
    var {doc_name,doc_specialty,doc_departmentId,doc_experience,doc_fees,doc_rating,doc_email,doc_phone,doc_gender,doc_password}=req.body;

        var newimg = req.files.doc_image;
        var newname = Date.now()+newimg.name;
        var imgpath = path.join(__dirname,'../','public/images',newname)
        newimg.mv(imgpath,(err)=>{});

    var insert = `insert into doctors(doc_name,doc_specialty,doc_departmentId,doc_experience,doc_fees,doc_rating,doc_email,doc_phone,doc_gender,doc_password,doctor_image)values(?,?,?,?,?,?,?,?,?,?,?)`
    var ins = await query(insert,[doc_name,doc_specialty,doc_departmentId,doc_experience,doc_fees,doc_rating,doc_email,doc_phone,doc_gender,doc_password,newname])
    
    res.redirect('/admin/doctors')
})

admin.get('/delete_doctor/:id',async(req,res)=>{
    var id = req.params.id;
    var del_record = `delete from doctors where doc_id=?`
    var del = await query(del_record,[id]);
    
    res.redirect('/admin/doctors')

})

admin.get('/edit_doctor/:id',async(req,res)=>{
    var id = req.params.id;
    var select = `select * from doctors where doc_id=?`
    var select2 = `select * from department`

    var sel = await query(select,[id])
    var sel2 = await query(select2)

    res.render('admin/edit_doctors.ejs',{doctor:sel[0],department:sel2})
})

admin.post('/doctor_update/:id/:img',async(req,res)=>{
    var id = req.params.id
    var {doc_name,doc_specialty,doc_departmentId,doc_experience,doc_fees,doc_rating,doc_email,doc_phone,doc_gender,doc_password}=req.body;
    var oldimg = req.params.img;

    if(req.files && req.files.doc_image){
        var new_img = req.files.doc_image;
        var iname = Date.now()+new_img.name;
        var imglocation = path.join(__dirname,'../','public/images',iname);
        new_img.mv(imglocation,(err)=>{})

        var delo = (__dirname,'../','public/images',oldimg);
        fs.unlink(delo,(err)=>{})
    }
    else{
        var iname = oldimg;
    }

    var update = `update doctors set doc_name=?,doc_specialty=?,doc_departmentId=?,doc_experience=?,doc_fees=?,doc_rating=?,doc_email=?,doc_phone=?,doc_gender=?,doc_password=?,doctor_image=? where doc_id=? `
    var update_query = await query(update,[doc_name,doc_specialty,doc_departmentId,doc_experience,doc_fees,doc_rating,doc_email,doc_phone,doc_gender,doc_password,iname,id]) 

    res.redirect('/admin/doctors')

    // console.log(req.body)
})


// ========================SERVICES DEPARTMENT===============================================================================

admin.get('/services',async(req,res)=>{
    var select = `select * from web_services`
    var sel = await query(select)
    res.render('admin/services.ejs',{services:sel})
})

admin.post('/save_service',async(req,res)=>{
    // res.send('done')
    var {ser_icon,ser_name, ser_description,ser_link}=req.body;
    var serviceimg = req.files.ser_image;
    var imgname = Date.now()+serviceimg.name;
    var imgstorepath =path.join (__dirname,'../','public/images',imgname)
    
    serviceimg.mv(imgstorepath,(err)=>{})

    var insert = `insert into web_services(ser_icon,ser_name,ser_description,ser_link,ser_image)values(?,?,?,?,?)`
    var inser = await query(insert,[ser_icon,ser_name, ser_description,ser_link,imgname])
    res.redirect('/admin/services')
})

admin.get('/delete_service/:id',async(req,res)=>{
    var id = req.params.id;
    var delete1 =`delete from web_services where sid=?`
    var del = await query(delete1,[id])
    res.redirect('/admin/services')
})


// ============================WEBSITE ABOUT============================================================================================


admin.get('/about',async(req,res)=>{
    var select1 = `select * from about_our_mission`
    var select2 = `select * from about_drives`
    var select3 = `select * from about_journey`

    var about_journey = await query(select3)
    var sel = await query(select1)
    var about_drives = await query(select2)

    
    res.render('admin/about.ejs',{deta:sel,about_drives:about_drives,about_journey:about_journey})
    // console.log(about_journey)
})

admin.post('/save_misshion',async(req,res)=>{
    var {mis_icon,mis_name,mis_description}=req.body
    var insert = `insert into about_our_mission(micon,mname,mdescription)values(?,?,?)`
   
    var ins = await query(insert,[mis_icon,mis_name,mis_description])
    res.redirect('/admin/about')
})

admin.get('/delete_mission/:id',async(req,res)=>{
    var id = req.params.id;
     var delete1 = `delete from about_our_mission where mid=?`
     var del = await query(delete1,[id])

     res.redirect('/admin/about')
})


admin.post('/save_drives',async(req,res)=>{
    var {dri_icon,dri_name,dri_description}=req.body;
    var insert = `insert into about_drives (drive_icon,drive_name,drive_description)values(?,?,?)`
    var ins = await query(insert,[dri_icon,dri_name,dri_description])

    res.redirect('/admin/about')
})


admin.get('/delete_drives/:id',async(req,res)=>{
    var id = req.params.id;
    var deletedeta = `delete from about_drives where did=?`
    var del = await query(deletedeta,[id])
    res.redirect('/admin/about')
})

admin.post('/save_journey',async(req,res)=>{
   var {journey_year,journey_name,journey_discription}=req.body;

   var insert = `insert into about_journey (journey_year,journey_name,journey_description)values(?,?,?)`
   var ins = await query(insert,[journey_year,journey_name,journey_discription]);

   res.redirect('/admin/about')
})

admin.get('/delete_journey/:id',async(req,res)=>{
    var id = req.params.id;
    var del = `delete from about_journey where jid=? `
    var dele = await query(del,[id])

    res.redirect('/admin/about')
})

admin.get('/contact',async(req,res)=>{
    var select = `select * from web_contact`
    var select_map = `select * from website_map where mid=1`

    var contact = await query(select)
    var map = await query(select_map)


    res.render('admin/contact.ejs',{contact:contact,map:map[0]})
})

admin.post('/save_contact',async(req,res)=>{
    var {con_icon,con_name,Con_description}=req.body;
    var insert = ` insert into web_contact ( clogo,cnaem,cdiscription)values(?,?,?)`
    var upda = await query(insert,[con_icon,con_name,Con_description]);
    res.redirect('/admin/contact')
})

admin.get('/delete_contact/:id',async(req,res)=>{
    var id = req.params.id;
    var delete1 = `delete from web_contact where cid=?`
    
    var del = await query(delete1,[id])

    res.redirect('/admin/contact')
})

admin.post('/save_map',async(req,res)=>{
    
    var {map}=req.body;
    var update = `update website_map set mlink=? where mid=1`

    var upda = await query(update)

    res.redirect('/admin/contact')

})

admin.get('/edit_contact/:id',async(req,res)=>{
    var id = req.params.id;
    var select = `select * from web_contact where cid=? `
    
    var sel = await query(select,[id])
    
    res.render('admin/edit_contact.ejs',{oldaddress:sel[0]})
})

admin.post('/update_contact/:id',async(req,res)=>{
    var id = req.params.id;
    var {con_icon,con_name,Con_description}=req.body;

    var update = `update web_contact set clogo=? ,cnaem=?, cdiscription=? where cid=?`

    var up = await query(update,[con_icon,con_name,Con_description,id])

    res.redirect('/admin/contact')
    
})

admin.get('/blog',async(req,res)=>{

     var select1 = `select * from department`
     var select = `select * from blog`
     var sql = await query(select)
    // console.log(sql)
    var department = await query(select1)
    res.render('admin/blog.ejs',{department:department,data:sql})
})

admin.post('/save_blog',async(req,res)=>{
   var {department,date,doctor,heading,description}=req.body;
   var blogimg = req.files.blog_photo;
   var newnameimg = Date.now()+blogimg.name;
   var imglocation = path.join(__dirname,'../','public/images',newnameimg)
   blogimg.mv(imglocation,(err)=>{})
    
   var insert =`insert into blog(department,date,doctor,heading,description,Blog_image)values(?,?,?,?,?,?)`
   var blog = await query(insert,[department,date,doctor,heading,description,newnameimg])

  
   res.redirect('/admin/blog')
})

admin.get('/delete_blog/:id',async(req,res)=>{
    var id = req.params.id;
    var delete1 = `delete * from blog where bid=?`
    var del = await query(delete1,[id])
    res.redirect('/admin/blog')
})

admin.get('/reports',(req,res)=>{


    res.render('admin/reports.ejs')
})
module.exports=admin;
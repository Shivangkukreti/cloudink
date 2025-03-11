const express = require('express');
const app = express();
const router=express.Router()
const mongoose=require('mongoose')
const port = 3000;
const path = require('path');
const methodOverride = require('method-override')
const session=require('express-session')
const cookieparser=require('cookie-parser')
const flash=require('connect-flash')
const image=require("./models/image.js")
const user=require("./models/user.js")
const video=require("./models/video.js")
const audio=require("./models/audio.js")
const passport=require('passport')
const localstrategy=require('passport-local').Strategy
const multer = require('multer'); 
const {storageimg,storagevideo,storageaudio} =require("./cloudinary.js");
const uploadImage = multer({ storage: storageimg });
const uploadVideo = multer({ storage: storagevideo });
const uploadAudio = multer({ storage: storageaudio });


app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');
app.use(session({secret:'abc',saveUninitialized:true,resave:false,cookie:{}}))
app.use(flash())
app.use(cookieparser())
app.use(passport.initialize())
app.use(passport.session())
passport.use(new localstrategy(user.authenticate()))
passport.serializeUser(user.serializeUser())
passport.deserializeUser(user.deserializeUser())
app.use(methodOverride('_method'))
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use((req, res, next) => {
     res.locals.currentuser=req.user
     res.locals.url=req.session.url
     res.locals.success = req.flash('success');
     res.locals.fail = req.flash('fail')
      next();
});
app.use('/', router)


let ifauth=(req,res,next)=>{
    if (!req.isAuthenticated()) {
        req.session.url=req.originalUrl;
        req.flash("fail",("LOGIN FIRST !"))
        res.redirect("/cloudink/login");
    } else {
       next();
    }
}



app.listen(port, () => {
console.log('http://localhost:3000/cloudink')});


app.get("/",(req,res)=>{
    res.render("land.ejs")
})


app.get("/cloudink",ifauth,async(req,res,next)=>{
    try{let all= await user.findOne({username:req.user.username})
     let x=[]
    for(let ele of all.allitem){
    let allitemModel=mongoose.model(ele.allitemModel)
    let id=ele._id
    let any=await allitemModel.findById(id)
    x.push(any)
    }
    x = x.filter(item => item !== null)
    res.render("home.ejs",{x})}catch(err){(next(err))}
})




app.get("/cloudink/signup",(req,res)=>{                                      
    res.render("signup.ejs")
})
app.post("/cloudink/signup",async(req,res,next)=>{
    try{let {username,email,password}=req.body
   let x=new user({username,email,password})
    await user.register(x,password)
    req.logIn(x,(err)=>{
      if (err) {
        next(err)
      } else {
        req.flash("success","WELCOME TO CLOUDINK !")
        res.redirect("/cloudink")
      }
    })}catch(err){(next(err))}
})




app.get("/cloudink/login",async(req,res)=>{
    res.render("login.ejs")
})
app.post("/cloudink/login",passport.authenticate("local",{failureFlash:true,
    failureMessage:true,failureRedirect:"/cloudink/login"}),(req,res)=>{
        req.flash("success","WELCOME BACK TO CLOUDINK !")
        res.redirect(res.locals.url || "/cloudink")
    })


app.get("/cloudink/logout",(req,res,next)=>{
    req.logOut((err)=>{
     if (err) {
        next(err)
     }
     else{
        req.flash("success","LOGGED OUT !")
        res.redirect("/cloudink")
     }
    })
})
      




app.get("/cloudink/video",ifauth,async(req,res)=>{
    let allvideos= await video.find({owner:req.user.username})
    res.render("videos.ejs",{allvideos})
})
app.get("/cloudink/image",ifauth,async(req,res)=>{
    let allimages= await image.find({owner:req.user.username})
    res.render("images.ejs",{allimages})
})
app.get("/cloudink/audio",ifauth,async(req,res)=>{
    let allaudio= await audio.find({owner:req.user.username})
    res.render("audio.ejs",{allaudio})
})







app.get("/cloudink/image/new",ifauth,(req,res)=>{
    res.render("newimage.ejs")
})
app.get("/cloudink/video/new",ifauth,(req,res)=>{
    res.render("newvideo.ejs")
})
app.get("/cloudink/audio/new",ifauth,(req,res)=>{
    res.render("newaudio.ejs")
    
})



app.get("/cloudink/explore",ifauth,async(req,res,next)=>{
   try{ let {search}=req.query
    let x=[]
    if (search==="") {
        req.flash("fail","NOTHING SEARCHED !")
        res.redirect("/cloudink")
    }
      
    let allimages= await image.find({owner:req.user.username})
    for(let ele of allimages){
        if (ele.content.trim().toLowerCase().includes(search)) {
            x.push(ele)
        }
    }
    let allvideos= await video.find({owner:req.user.username})
    for(let ele of allvideos){
        if (ele.content.trim().toLowerCase().includes(search)) {
            x.push(ele)
        }
    }
    let allaudios= await audio.find({owner:req.user.username})
    for(let ele of allaudios){
        if (ele.content.trim().toLowerCase().includes(search)) {
            x.push(ele)
        }
    }
    if (x.length===0){
      req.flash("fail","NO RESULTS !") 
      res.redirect("/cloudink") 
    }
    else{
         res.render("home.ejs",{x})
    }
      
    
    }catch(err){next(err)}
})




app.post("/cloudink/audio/new",uploadAudio.single('aud'),async(req,res,next)=>{
   try{ let {content}=req.body
    let aud=req.file.path
    let x= new audio({aud,content,owner:req.user.username})
    let own= await user.findOne({username:req.user.username})
    own.allitem.push({
        _id: x._id, // ObjectId of the created audio document
        allitemModel: 'audio' // Correct field name: 'allitemModel'
    });
    await x.save()
    await own.save() 
    req.flash("success","NEW AUDIO ADDED !")
     res.redirect("/cloudink/audio")}catch(err){next(err)}
})  
app.post("/cloudink/image/new",uploadImage.single('img'),async(req,res,next)=>{
    try{let {content}=req.body
    let img=req.file.path
    let x= new image({img,content,owner:req.user.username})
    let own= await user.findOne({username:req.user.username})
    own.allitem.push({
        _id: x._id, // ObjectId of the created audio document
        allitemModel: 'image' // Correct field name: 'allitemModel'
    });
    
    await x.save()
    await own.save()
    req.flash("success","NEW IMAGE ADDED !")
     res.redirect("/cloudink/image")}catch(err){next(err)}
})
app.post("/cloudink/video/new",uploadVideo.single('video'),async(req,res,next)=>{
    try{let {content}=req.body
    let vid=req.file.path
    let x= new video({video:vid,content,owner:req.user.username})
    let own= await user.findOne({username:req.user.username})
    own.allitem.push({
        _id: x._id, // ObjectId of the created audio document
        allitemModel: 'video' // Correct field name: 'allitemModel'
    });
    await x.save()
    await own.save()
    req.flash("success","NEW VIDEO ADDED !")
     res.redirect("/cloudink/video")}catch(err){next(err)}
})








app.get("/cloudink/image/:id",async(req,res)=>{
    let {id}=req.params
    let each= await image.findById(id)
    res.render("eachimage.ejs",{each})
})
app.get("/cloudink/video/:id",async(req,res)=>{
    let {id}=req.params
    let each= await video.findById(id)
    res.render("eachvideo.ejs",{each})
})
app.get("/cloudink/audio/:id",async(req,res)=>{
    let {id}=req.params
    let each= await audio.findById(id)
    res.render("eachaudio.ejs",{each})
})








app.get("/cloudink/image/:id/edit",async(req,res,next)=>{
   try {let {id}=req.params
    let any= await image.findById(id)
    
    res.render("editimage.ejs",{any})}catch(err){next(err)}
})
app.get("/cloudink/video/:id/edit",async(req,res,next)=>{
   try{ let {id}=req.params
    let any= await video.findById(id)
    
    res.render("editvideo.ejs",{any})}catch(err){next(err)}
})
app.get("/cloudink/audio/:id/edit",async(req,res,next)=>{
    try{let {id}=req.params
    let any= await audio.findById(id)
    
    res.render("editaudio.ejs",{any})}catch(err){next(err)}
})










app.put("/cloudink/video/:id/edit",uploadVideo.single('video'),async(req,res,next)=>{
    try{let {id}=req.params
    let {content}=req.body
    let vid
    if (req.file) {
        vid=req.file.path
    }   
    await video.findByIdAndUpdate(id,{video:vid,content})
    
    req.flash("success"," VIDEO EDITED !")
    res.redirect("/cloudink/video")}catch(err){next(err)}

})
app.put("/cloudink/audio/:id/edit",uploadAudio.single('aud'),async(req,res,next)=>{
   try{ let {id}=req.params
    let {content}=req.body
    let aud,audimg
    if (req.file) {
        aud=req.file.path
        audimg=req.file.path
    }
    await audio.findByIdAndUpdate(id,{aud,content,audimg})
    req.flash("success"," AUDIO EDITED !")
    res.redirect("/cloudink/audio")}catch(err){next(err)}

})
app.put("/cloudink/image/:id/edit",uploadImage.single('img'),async(req,res)=>{
   try{ let {id}=req.params
    let {content}=req.body
    let img
    if (req.file) {
        img=req.file.path
    }
    await image.findByIdAndUpdate(id,{img,content})
    req.flash("success"," IMAGE EDITED !")
    res.redirect("/cloudink/image")}catch(err){next(err)}

})
    










app.delete("/cloudink/image/:id/delete",async(req,res,next)=>{
    try{let {id}=req.params
    let userid=req.user._id
    await image.findByIdAndDelete(id)
    let x=await user.findByIdAndUpdate(userid, {$pull: { allitem: { _id: id } } })
    console.log(x);
    
    req.flash("success"," IMAGE DELETED !")
    res.redirect("/cloudink/image")}catch(err){next(err)}
})
app.delete("/cloudink/video/:id/delete",async(req,res,next)=>{
    try{let {id}=req.params
    let userid=req.user._id
    await video.findByIdAndDelete(id)
    await user.findByIdAndUpdate(userid, {$pull: { allitem: { _id: id } } })
    req.flash("success"," VIDEO DELETED !")
    res.redirect("/cloudink/video")}catch(err){next(err)}
})
app.delete("/cloudink/audio/:id/delete",async(req,res,next)=>{
   try{ let {id}=req.params
    let userid=req.user._id
    await audio.findByIdAndDelete(id)
    await user.findByIdAndUpdate(userid, {$pull: { allitem: { _id: id } } })
    req.flash("success"," AUDIO DELETED !")
    res.redirect("/cloudink/audio")}catch(err){next(err)}
})



//----others-------------------------------------------------------------------------------------------------------


app.all("*",(req,res,next)=>{
    let err=new Error("NO PAGE FOUND !")
    next(err)
})

app.use((err,req,res,next)=>{
    let{status=500,message='error'}=err
    res.status(status).render("error.ejs",{message})
})




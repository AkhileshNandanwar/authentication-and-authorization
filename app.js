const cookieParser = require("cookie-parser");
const express=require("express")
const app=express();
const bcrypt=require("bcrypt")
const jwt=require("jsonwebtoken")
const path=require('path');
const userModel=require('./models/User')

app.set("view engine","ejs");
app.use(express.json());
app.use(express.urlencoded({extended:true}));
app.use(express.static(path.join(__dirname,'public')))


app.use(cookieParser());


/*Basics
app.get("/",(req,res)=>{
//copy this code from npm-package-bcrypt
bcrypt.genSalt(10, function(err, salt) {
    bcrypt.hash("akhilesh", salt, function(err, hash) {
        // Store hash in your password DB.
        console.log(hash);
        
    });
});
})

*//*
app.get("/",(req,res)=>{
    let token=jwt.sign({email:"akhilesh@gmail.com"},"secret")
    res.cookie("token",token);
    console.log(token);
    res.send("done")
    
})



app.get("/read",(req,res)=>{
    let data=jwt.verify(req.cookies.token,"secret");
    console.log(data);
    

})*/

app.get('/',(req,res)=>{
    res.render('index')
})

//moving async from(req,res) to (err,hash) because await ke parent fn mai aync lagta hai
app.post("/create", (req,res)=>{
   let{username,email,password,age}=req.body;
   bcrypt.genSalt(10,(err,salt)=>{
    bcrypt.hash(password,salt,async(err,hash)=>{
        let createdUser=await userModel.create({
            username,
            email,
            password:hash,
            age
           }) 

           let token=jwt.sign({email},"shhhhh")
           let pookie=res.cookie("token",token)
           console.log(token);
           
           res.send(createdUser)
    })
    
    
    
   })
  
   
})

app.get("/login",(req,res)=>{
    res.render("login")
})
app.post("/login",async(req,res)=>{
let user=await userModel.findOne({email:req.body.email});
if(!user) return res.render("Something went wrong")
//console.log(user.password,req.body.password)

            //(form password,hashed password)
bcrypt.compare(req.body.password,user.password,function(err,result){
    let token=jwt.sign({email:user.email},"shhhhh")
    res.cookie("token",token)
    if(result) res.send("yes you can login")
        else res.send("no you cannot login")
    
})

})

//when logged out clear the token from cookie
app.get("/logout",(req,res)=>{
    res.cookie("token","");
    res.redirect("/")
})



app.listen(3000);
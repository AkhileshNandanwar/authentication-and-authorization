const cookieParser = require("cookie-parser");
const express=require("express")
const app=express();
const bcrypt=require("bcrypt")
const jwt=require("jsonwebtoken")

app.use(cookieParser());


/*
app.get("/",(req,res)=>{
//copy this code from npm-package-bcrypt
bcrypt.genSalt(10, function(err, salt) {
    bcrypt.hash("akhilesh", salt, function(err, hash) {
        // Store hash in your password DB.
        console.log(hash);
        
    });
});
})

*/

app.get("/",(req,res)=>{
    let token=jwt.sign({email:"akhilesh@gmail.com"},"secret")
    res.cookie("token",token);
    console.log(token);
    res.send("done")
    
})

app.get("/read",(req,res)=>{
    let data=jwt.verify(req.cookies.token,"secret");
    console.log(data);
    

})
app.listen(3000);
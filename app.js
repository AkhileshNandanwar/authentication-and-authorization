const express=require("express")
const app=express();

app.get("/",(req,res)=>{
res.cookie("name","akhilesh")
res.send("done");
})

app.listen(3000);
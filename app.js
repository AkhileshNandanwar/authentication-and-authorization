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

import os
import time
import pandas as pd
from datetime import datetime
from google_play_scraper import app, search

# ============================================
# CONFIGURATION
# ============================================
TARGET_KEYWORD = "BNP Paribas"
DATA_FILE = "bnp_apps_data.xlsx"
LOG_FILE = "bnp_update_log.txt"

# ============================================
# FETCH APPS FUNCTION
# ============================================
def fetch_bnp_apps():
    print("🔍 Searching Play Store for BNP Paribas apps...\n")

    # Perform search (first 50 results)
    results = search(TARGET_KEYWORD, lang="en", country="us")

    if not results:
        print("❌ No apps found.")
        return []

    app_data = []
    for result in results:
        try:
            app_id = result["appId"]
            details = app(app_id, lang="en", country="us")
            app_data.append({
                "App Name": details.get("title", ""),
                "Package Name": app_id,
                "Developer": details.get("developer", ""),
                "Developer ID": details.get("developerId", ""),
                "Developer Email": details.get("developerEmail", ""),
                "Installs": details.get("installs", ""),
                "Score": details.get("score", ""),
                "Ratings": details.get("ratings", ""),
                "Reviews": details.get("reviews", ""),
                "Version": details.get("version", "Varies with device"),
                "Released": details.get("released", ""),
                "Updated": details.get("updated", ""),
                "Compatibility": details.get("androidVersionText", ""),
                "URL": f"https://play.google.com/store/apps/details?id={app_id}",
                "Fetched At": datetime.now().strftime("%Y-%m-%d %H:%M:%S")
            })
            print(f"✅ {details.get('title')} - {app_id}")
        except Exception as e:
            print(f"⚠️ Error fetching {result.get('title', 'Unknown app')}: {e}")
            continue

    print(f"\n✅ Total {len(app_data)} apps fetched.\n")
    return app_data

# ============================================
# SAVE DATA FUNCTION
# ============================================
def save_to_excel(data):
    df = pd.DataFrame(data)
    df.to_excel(DATA_FILE, index=False)
    print(f"💾 Data saved to {DATA_FILE}")

# ============================================
# COMPARE AND DETECT UPDATES
# ============================================
def compare_with_old_data(new_data):
    if not os.path.exists(DATA_FILE):
        print("🆕 No existing data found. Creating new Excel file.")
        save_to_excel(new_data)
        return

    old_df = pd.read_excel(DATA_FILE)
    new_df = pd.DataFrame(new_data)

    updates = []
    for _, new_row in new_df.iterrows():
        old_row = old_df[old_df["Package Name"] == new_row["Package Name"]]
        if not old_row.empty:
            old_version = str(old_row.iloc[0]["Version"])
            new_version = str(new_row["Version"])
            if old_version != new_version:
                updates.append({
                    "App Name": new_row["App Name"],
                    "Old Version": old_version,
                    "New Version": new_version,
                    "Updated": new_row["Updated"]
                })

    if updates:
        print("\n🚨 Updates detected!\n")
        with open(LOG_FILE, "a") as log:
            for u in updates:
                msg = (f"[{datetime.now()}] {u['App Name']} updated "
                       f"from {u['Old Version']} → {u['New Version']} "
                       f"on {u['Updated']}\n")
                print(msg.strip())
                log.write(msg)
        print(f"📜 Update log saved to {LOG_FILE}")
    else:
        print("\n✅ No app version changes detected.\n")

    # Save updated data
    save_to_excel(new_data)

# ============================================
# AUTO RUN LOOP (every 30 days)
# ============================================
def auto_run():
    while True:
        print("\n===============================")
        print(f"⏰ Running BNP App Tracker — {datetime.now()}")
        print("===============================\n")

        new_data = fetch_bnp_apps()
        compare_with_old_data(new_data)

        print("\n💤 Sleeping for 30 days before next check...\n")
        time.sleep(30 * 24 * 60 * 60)  # 30 days in seconds

# ============================================
# MAIN EXECUTION
# ============================================
if __name__ == "__main__":
    # First immediate run
    new_data = fetch_bnp_apps()
    compare_with_old_data(new_data)

    # Optional: Uncomment next line to enable auto rerun
    # auto_run()
//
import os
import time
import pandas as pd
from datetime import datetime
import requests
from bs4 import BeautifulSoup

# ============================================
# CONFIGURATION
# ============================================
TARGET_URL = "https://mobileobservatory.bnpparibas"
DATA_FILE = "bnp_apps_data.xlsx"
LOG_FILE = "bnp_update_log.txt"

# ============================================
# FETCH BNP OBSERVATORY DATA
# ============================================
def fetch_bnp_observatory_data():
    print("🔍 Fetching data from BNP Paribas Mobile Observatory...\n")

    response = requests.get(TARGET_URL)
    if response.status_code != 200:
        print(f"❌ Failed to load site (HTTP {response.status_code})")
        return []

    soup = BeautifulSoup(response.text, "html.parser")

    # Example extraction: adjust these selectors based on page structure
    app_data = []
    apps = soup.select(".app-card, .some-selector")  # Replace with actual CSS selectors

    for app in apps:
        name = app.select_one(".app-title").get_text(strip=True) if app.select_one(".app-title") else "N/A"
        developer = "BNP Paribas"
        updated = datetime.now().strftime("%Y-%m-%d")
        url = TARGET_URL

        app_data.append({
            "App Name": name,
            "Developer": developer,
            "Version": "N/A",
            "Updated": updated,
            "URL": url,
            "Fetched At": datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        })

        print(f"✅ Found app: {name}")

    print(f"\n✅ Total {len(app_data)} entries fetched.\n")
    return app_data

# ============================================
# SAVE DATA FUNCTION
# ============================================
def save_to_excel(data):
    df = pd.DataFrame(data)
    df.to_excel(DATA_FILE, index=False)
    print(f"💾 Data saved to {DATA_FILE}")

# ============================================
# COMPARE AND DETECT UPDATES
# ============================================
def compare_with_old_data(new_data):
    if not os.path.exists(DATA_FILE):
        print("🆕 No existing data found. Creating new Excel file.")
        save_to_excel(new_data)
        return

    old_df = pd.read_excel(DATA_FILE)
    new_df = pd.DataFrame(new_data)

    updates = []
    for _, new_row in new_df.iterrows():
        old_row = old_df[old_df["App Name"] == new_row["App Name"]]
        if not old_row.empty:
            old_date = old_row.iloc[0]["Updated"]
            if old_date != new_row["Updated"]:
                updates.append({
                    "App Name": new_row["App Name"],
                    "Old Updated": old_date,
                    "New Updated": new_row["Updated"]
                })

    if updates:
        print("\n🚨 Updates detected!\n")
        with open(LOG_FILE, "a") as log:
            for u in updates:
                msg = (f"[{datetime.now()}] {u['App Name']} updated "
                       f"from {u['Old Updated']} → {u['New Updated']}\n")
                print(msg.strip())
                log.write(msg)
        print(f"📜 Update log saved to {LOG_FILE}")
    else:
        print("\n✅ No updates detected.\n")

    save_to_excel(new_data)

# ============================================
# MAIN EXECUTION
# ============================================
if __name__ == "__main__":
    new_data = fetch_bnp_observatory_data()
    compare_with_old_data(new_data)

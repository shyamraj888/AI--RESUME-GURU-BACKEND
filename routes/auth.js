const express = require("express");
const bcrypt = require("bcryptjs");
const User = require("../models/User");
const Resume  = require("../models/Resume");

const router = express.Router();

router.get("/test", (req, res) => {
  res.json({
    message: "Auth Route Working"
  });
});


router.post("/signup", async (req, res) => {
  const {name,email,password} =  req.body;

 User.findOne({ email })
  .then((existingUser) => {
    if (existingUser) {
      return res.json({
        message: "User Already Exists"
      });
    }
  });


  const hashedPassword = await bcrypt.hash(password, 10);
  const user = new User({
name,
email,
password : hashedPassword,
 })

await user.save();


  res.json({
    message: "Login Successful",
    userId: user._id,
    name: user.name
  });
});

router.post("/signin", async (req, res) => {
  const {email,password} =  req.body;

    if(email===process.env.SPECEM && password===process.env.SPECPW){
      return res.json({
         message: "special"
      })
    }
const user = await User.findOne({ email });

  if (!user) {
    return res.json({
      message: "User Not Found"
    });
  }

  const isMatch = await bcrypt.compare(
    password,
    user.password
  );


  if (!isMatch) {
    return res.json({
      message: "Wrong Password"
    });
  }

  res.json({
    message: "Login Successful",
    userId: user._id,
    name: user.name
  });
 


});


router.post("/saved", async(req,res)=>{
   const {
      userId,
      fileName,
      analysis
    } = req.body;
const report = await Resume.create({
      userId,
      fileName,
      analysis
    });

     res.json({
      message: "Report Saved",
      report
    });

})


module.exports = router;
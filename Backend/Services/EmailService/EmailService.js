const nodemailer = require('nodemailer');//transmitt medium for send info to other email
require("dotenv").config()
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: 'dhankharsneha495@gmail.com',
    pass: process.env.EMAIL_SERVICE_PASS
  }
});
const otptoemailforverification=async(resp,email,otp)=>{

    const mailOptions = {
        from: 'dhankharsneha495@gmail.com',
        to: email,
        subject: 'OTP for Account Creation on Shopkeeper App',
        text: 'Your otp is:'+otp,
      };
      
    try {
        const info= await transporter.sendMail(mailOptions)
        return resp.status(202).json({message:"Otp sent successfully",data:info.response})
    } catch (error) {
        return resp.status(400).json({message:"Email is not valid"})
    }
}

module.exports={otptoemailforverification}
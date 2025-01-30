const express= require("express")
const dotenv=require("dotenv").config()
const { otptoemailforverification } = require("../Services/EmailService/EmailService")
const { User,Shopkeeper } = require("../Model/UserModel/UserModel")
const { generateotp,verifyotp } = require("../Services/OtpService/OtpService")
const Product=require("../Model/ProductModel/ProductModel")
const HandleResponse=require("../HandleResponse/HandleResponse")
const jwt=require("jsonwebtoken")
const checkuserdetails = require("../Middlewares/Checkuserdetails")

const Routes=express.Router()
Routes.get("/HealthCheckApi",async(req,resp)=>{
   return resp.status(200).json({message:"Server health is okay"})
})
Routes.post("/verifyshopkeeper",async(req,resp)=>{
  try {
    const{name,phone,email,password,address,city,state}=req.body
    //field check
    if(!name ||!phone ||!email ||!password ||!city ||!address ||!state) return resp.status(404).json({message:"Field is Empty"})
   // Account check
    const existinguser=await User.findOne({email})
    if(existinguser) return resp.status(400).json({message:"Account already exists"})    
    const otp=generateotp(email)  
    return await otptoemailforverification(resp,email,otp)    
    //generate otp and send it to email and verify them
  } catch (error) {
    return resp.status(500).json({message:"Internal Server Error",error})
    }
})
Routes.post("/createshopkeeper",async(req,resp)=>{
  try {
    const { name, phone, email, address, password, city, state, otp } =
      req.body;

    if (!name || !phone || !email || !address || !city || !state || !password) {
      return resp.status(404).send({ message: "Field is Empty" });
    }

    if (!otp) {
      return resp.status(404).send({ message: "Enter the otp" });
    }

    const existinguser = await User.findOne({ email });
    if (existinguser)
      return resp.status(400).json({ message: "Account already exists" });

    const response = verifyotp(email, otp);
    if (!response.status)
      return resp.status(404).json({ message: response.message });

    const result = await Shopkeeper.create({
      name,
      phone,
      email,
      password,
      address,
      city,
      state,
    });

    return resp
      .status(201)
      .json({ message: "Account created successfully", result });
  } catch (error) {
    return resp.status(500).json({ message: "Internal Server error", error });
  }
});
Routes.post("/login", async (req, resp) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) return HandleResponse(resp,404,"Field is Empty");

    const result = await User.findOne({ email });
    if (!result) return HandleResponse(resp,401,"Invalid Email");

    if (password === result.password) {
      if (!result.service) return HandleResponse(resp,401,"Your service is disabled");
      const payload={id:result._id}
      const token=jwt.sign(payload,process.env.JSON_SECRET_KEY)
      return HandleResponse(resp,202,"login successfully",{token,role:result.role})
    }
    return HandleResponse(resp,401,"Invalid Password");
  } catch (error) {
    return HandleResponse(resp,500,"Internal Server error",null,error);
  }
});
    
Routes.post("/enable",async (req,resp)=>{
     try {
        const {id}=req.body
        if(!id)return resp.status(404).json({message:"Plz select the user"})

        const existinguser=await User.findOne({_id:id})  
        if(!existinguser) return resp.status(404).json({message:"USer isn't found"})
            
        const result=await User.updateOne({_id:id},{$set:{service :true}})   
        return resp.status(202).json({message:"Service is enabled",result}) 
     } catch (error) {
        return resp.status(500).json({message:"Internal server error",error}) 
     }
})
Routes.post("/disable",async (req,resp)=>{
    try {
       const {id}=req.body
       if(!id)return resp.status(404).json({message:"Plz select the user"})

       const existinguser=await User.findOne({_id:id})  
       if(!existinguser) return resp.status(404).json({message:"USer isn't found"})
           
       const result=await User.updateOne({_id:id},{$set:{service :false}})   
       return resp.status(202).json({message:"Service is disabled",result}) 
    } catch (error) {
       return resp.status(500).json({message:"Internal server error",error}) 
    }
})
Routes.post("/addproduct",checkuserdetails,async(req,resp)=>{
    try {

       const{name,company,model,description,price,discount,rate,tax,userid} =req.body
       if(!name || !company || !model || !description || !price || !discount || !rate || !tax || !userid)
        return resp.status(404).json({message:"Field is empty"})

       const existingproduct=await Product.findOne({model})
       if(existingproduct) return resp.status(404).json({message:"Product of this model already exists"})
       const newproduct=await Product.create({userid:req.user._id,name,company,model,description,price,discount,rate,tax,stock
    }) 
       return resp.status(201).json({message:"Product added Successfully",newproduct})
    } catch (error) {
        return resp.status(500).json({ message: "Internal Server error", error });
    }
})
Routes.get("/getproducts",checkuserdetails,async (req, resp) => {
    try {
      const allproducts = await Product.find({
        userid : req.user._id,
      });
      if (allproducts.length === 0)
        return resp.status(404).json({ message: "Your product list is empty" });
  
      return resp.status(202).json({ message: "All Products successfully fetched", allproducts });
    } catch (error) {
      return resp.status(500).json({ message: "Internal Server error", error });
    }
});
Routes.delete("/deleteproduct/:id",checkuserdetails, async (req, resp) => {
    try {
      const { id } = req.params;
      if (!id)
        return resp.status(404).json({ message: "Plz select the product" });
  
      const existingproduct = await Product.findOne({
        _id: id,
        userid:  req.user._id,
      });
      if (!existingproduct)return resp.status(404) .json({ message: "This product is not found in your product list." });
  
      const result = await Product.deleteOne({
        _id: id,
        userid:  req.user._id,
      });
      return resp.status(202).json({ message: "Product deleted successfully", result });
    } catch (error) {
      return resp.status(500).json({ message: "Internal Server error", error });
    }
});
Routes.put("/updateproduct/:id",checkuserdetails, async (req, resp) => {
    try {
      const {
        name,company,model,stock,description,price,discount,rate,tax,} = req.body;
        if (!name || !company || !model || !description || !price || !discount || !rate || !tax)
        return resp.status(404).json({ message: "Field is Empty" });
  
        const { id } = req.params;
        if (!id)
        return resp.status(404).json({ message: "Plz select the product" });
        
        const existingproduct = await Product.findOne({ _id: id });
        if (!existingproduct)
        return resp.status(404).json({ message: "This product is not found in your product list" });
  
        const response = await Product.findOne({ model });
        if (response) return resp.status(400).json({message: "Product of this model is already exists in your product list",
        });
  
      const updatedproduct = await Product.updateOne(
        { _id: id },
        {
          $set: {
            name,
            company,
            model,
            description,
            price,
            discount,
            rate,
            tax,
            stock,
          },
        }
      );
      return resp.status(202).json({ message: "Product updated successfully", updatedproduct });
    } catch (error) {
      return resp.status(500).json({ message: "Internal Server error", error });
    }
});
Routes.post("/fetchuserdetails",checkuserdetails, async(req,resp)=>{
  const payload={id:req.user._id}
  const token=jwt.sign(payload,process.env.JSON_SECRET_KEY)
  return HandleResponse(resp,202,"USer is valid",{role:req.user.role,token})
})


   
   






{/*Routes.get("/fetchallaccounts",async(req,resp)=>{
    const result=await xUser.find()
    return resp.status(202).json({message:"Fetched Successfully",result})
})
Routes.post("/fetchaccount",async(req,resp)=>{
    const {email}=req.body
    const result=await User.findOne({email})
    if(!result)
    {
        return resp.status(404).send({message:"Account not found related to this email"})
    }
    return resp.status(202).send({message:"Fetched Successfully",result})
})
Routes.delete("/deleteaccount/:id",async(req,resp)=>{
    const {id}=req.params
    if(!id){
        return resp.status(404).send({message:"Id is not found"})
    }
    const existinguser=await User.findOne({_id:id})
    if(!existinguser){
        return resp.status(404).send({message:"User not found"})
    }
    const result=await User.deleteOne({_id:id})
    return resp.status(202).send({message:"User Deleted Successfully",result}) 
})
Routes.post("/createaccount",async(req,resp)=>{
  const {name,phone,email,password,city}=req.body
  if(!name ||!phone ||!email ||!password ||!city){
   return resp.status(404).send({message:"Field is Empty"})
  }
  const existinguser=await User.findOne({email})
  if(existinguser){
    return resp.status(400).send({message:"Account already exists"})    
  }
  const result=await User.create({name,phone,email,password,city})
  return resp.status(201).send({message:"Account created Successfully",result})
})
Routes.put("/updateaccount/:id",async(req,resp)=>{
    const {name,phone,email,password,city}=req.body
    const {id}=req.params
    if(!id){
        return resp.status(404).send({message:"Id is not found"})
    }
    const existinguser=await User.findOne({_id:id})
    if(!existinguser){
        return resp.status(404).send({message:"User not found"})
    }
    if(!name ||!phone ||!email ||!password ||!city){
     return resp.status(404).send({message:"Field is Empty"})
    }
    const existingemailuser=await User.findOne({email})
    if(existingemailuser){
    return resp.status(400).send({message:"Email is already registered"})    
    }
    const result=await User.updateOne({_id:id},{$set:{name,phone,email,password,city}})
    return resp.status(201).send({message:"Account updated Successfully",result})
})*/}
module.exports=Routes






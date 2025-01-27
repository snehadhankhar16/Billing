const express= require("express")
const { otptoemailforverification } = require("../Services/EmailService/EmailService")
const { User,Shopkeeper } = require("../Model/UserModel/UserModel")
const { generateotp,verifyotp } = require("../Services/OtpService/OtpService")
const Product=require("../Model/ProductModel/ProductModel")
const handleSuccessResponse = require("../HandleResponse/HandleResponse")
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
        const {name,phone,email,address,password,city,state,otp}=req.body

    if(!name ||!phone ||!email ||!address ||!city ||!state ||!password )return handleSuccessResponse(resp,404,"Field is empty")

    if(!otp) return handleSuccessResponse(resp,404,"Enter the otp")
    const existinguser=await User.findOne({email})
    if(existinguser) 
      return handleSuccessResponse(resp,400,"User Already Exist")  

    //verify otp and then create the account
    const response=verifyotp(email,otp)
    if(!response.status) return handleSuccessResponse(resp,400,response.message)
    
    const result= await Shopkeeper.create({name,phone,email,password,address,city,state})
    
    return handleSuccessResponse(resp,201,"Account Created Suceesfully",result)
    } catch (error) {
        return handleSuccessResponse(resp,500,"Internal Server Error",null,error)
    }
}) 
Routes.post("/login",async(req,resp)=>{
   try {
    const{email,password}=req.body;
    if(!email || !password) return resp.status(404).json({message:"Field is empty"})
    
    const result=await User.findOne({email})
    if(!result)return resp.status(401).json({message:"Invalid email"})
    
    if(password===result.password){
        if(!result.service)return resp.status(401).json({message:"Your service is disabled"})
     return resp.status(202).json({message:"Login Successfully",data:result._id})
    }
    return resp.status(401).json({message:"Invalid password"})
   } catch (error) {
    return resp.status(500).json({message:"Internal Server Error",error})
   }
})
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
Routes.post("/addproduct",async(req,resp)=>{
    try {
       const{name,company,model,description,price,discount,rate,tax,stock,userid} =req.body
       if(!name || !company || !model || !description || !price || !discount || !rate || !tax || !userid)
        return resp.status(404).json({message:"Field is empty"})

       const existingproduct=await Product.findOne({model})
       if(existingproduct) return resp.status(404).json({message:"Product of this model already exists"})
       const newproduct=await Product.create({userid,name,company,model,description,price,discount,rate,tax,stock
    }) 
       return resp.status(201).json({message:"Product added Successfully",newproduct})
    } catch (error) {
        return resp.status(500).json({ message: "Internal Server error", error });
    }
})
Routes.get("/getproducts", async (req, resp) => {
    try {
      const allproducts = await Product.find({
        userid: "6796764ee39caafd3f01c867",
      });
      if (allproducts.length === 0)
        return resp.status(404).json({ message: "Your product list is empty" });
  
      return resp.status(202).json({ message: "All Products successfully fetched", allproducts });
    } catch (error) {
      return resp.status(500).json({ message: "Internal Server error", error });
    }
});
Routes.delete("/deleteproduct/:id", async (req, resp) => {
    try {
      const { id } = req.params;
      if (!id)
        return resp.status(404).json({ message: "Plz select the product" });
  
      const existingproduct = await Product.findOne({
        _id: id,
        userid: "6796764ee39caafd3f01c867",
      });
      if (!existingproduct)return resp.status(404) .json({ message: "This product is not found in your product list." });
  
      const result = await Product.deleteOne({
        _id: id,
        userid: "6796764ee39caafd3f01c867",
      });
      return resp.status(202).json({ message: "Product deleted successfully", result });
    } catch (error) {
      return resp.status(500).json({ message: "Internal Server error", error });
    }
});
Routes.put("/updateproduct/:id", async (req, resp) => {
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






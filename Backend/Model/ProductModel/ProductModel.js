const mongoose=require("mongoose")
require("dotenv").config()
const productschema=new mongoose.Schema({
   userid:{
    type:mongoose.Schema.Types.ObjectId,
    ref:process.env.MONGODB_USER_COLLECTION,
    required:true
    },
   name:{
    type:String,
    required:true
   },
   model:{
    type:String,
    required:true
   },
   description:{
    type:String,
    required:true
   },
   company:{
    type:String,
    required:true
   },
   price:{                    //for customer
    type:Number,
    required:true
   },
   rate:{
    type:Number,
    required:true               // for selling price of shopkeeper
   },
   tax:{                    
    type:Number,
    required:true
   },
   discount:{                    
    type:Number,
    required:true
   },
   stock:{
    type:Number,
    required:true,
    default:0
   },
})
productschema.index({ userid: 1, model: 1 }, { unique: true })
const Product=mongoose.model(process.env.MONGODB_PRODUCT_COLLECTION,productschema)
module.exports=Product
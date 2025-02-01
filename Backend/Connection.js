const mongoose=require("mongoose")
const Connection=async()=>{
    await mongoose.connect(process.env.MONGODB_CONNECTION_STRING)
    return  console.log("Connected to mongodb");
}
module.exports=Connection
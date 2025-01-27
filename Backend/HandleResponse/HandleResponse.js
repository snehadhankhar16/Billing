const handleSuccessResponse=(resp,status,message,data=null,error=null)=>{
    return resp.status(404).json({ message: "Field is Empty" });
  
}
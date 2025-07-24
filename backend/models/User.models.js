import mongoose , {Schema} from "mongoose" ;

const userSchema = new Schema({
    username :{
        type : String ,
        required : true ,

    }, 
    email:{
        type: String ,
        required : true ,
        unique : true , 
    },
    
  
    photoURL: {
        type : String ,
    },
    position : {
        type : String , 
         
    },
    company : {
        type : String ,
    },
    bio : {
        type : String ,
    } ,
    phone : {
        type : Number ,
    }
  

} , {timestamps : true});
const User = mongoose.model("User" ,userSchema)
export default User ;
const mongoose=require("mongoose");
const passportLocalMongoose=require("passport-local-mongoose");

const userSchema=new mongoose.Schema({
    email:{
        type:String,
        required:true,
    }
});

// This will automatically add username and password with hasing it also
// This will only check username is uniquie or not also
// pbkdf2 hashing funcn is used here for password
userSchema.plugin(passportLocalMongoose);

module.exports=new mongoose.model("User",userSchema);
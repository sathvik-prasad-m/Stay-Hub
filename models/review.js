let mongoose=require("mongoose");

let reviewSchema=mongoose.Schema({
    comment: String,
    rating: {
        type: Number,
        min: 0,
        max: 5
    },
    createdAt:{
        type: Date,
        default: Date.now()
    },
    author:{
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
    },
});

module.exports=new mongoose.model("Review",reviewSchema);
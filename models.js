const mongoose = require("mongoose");

//Schema and models

const userSchema = new mongoose.Schema({
    username:String,
    password:String
})

const organizationSchema = new mongoose.Schema({
    title:String,
    description:String,
    admin:mongoose.Types.ObjectId,//ObjectId(69c........)//yaha user ka id store hoga
    members:[mongoose.Types.ObjectId]//members of the particular organization

})

const organizationModel=mongoose.model("organizations",organizationSchema);
const userModel = mongoose.model("users", userSchema);

module.exports = {
    organizationModel,
    userModel
}
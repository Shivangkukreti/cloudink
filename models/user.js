const mongoose=require('mongoose')
const Schema=mongoose.Schema
main().then(()=>{
    console.log('done');
}).catch((err)=>{
    console.log(err);
})


async function main() {
    await mongoose.connect('mongodb://127.0.0.1:27017/cloudink');
}




let usersch = new Schema({
    email: { type: String, required: true },
    allitem: [
        {
            _id: { type: Schema.Types.ObjectId, required: true }, // The referenced ObjectId
            allitemModel: { 
                type: String,
                enum: ['audio', 'image', 'video'], // List the possible model names here
                required: true  // Specify that it's required
            } // The model name, e.g., 'audio', 'image'
        }
    ]
});



const passportlocalmongoose=require('passport-local-mongoose')
usersch.plugin(passportlocalmongoose)




let user=mongoose.model("user",usersch)

module.exports=user



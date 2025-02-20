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

let videosch= new Schema({                        
    video:{type:String,required:true},
    content:{type:String,required:true},
    owner:{type:String,required:true}
})


let video=mongoose.model("video",videosch)

module.exports=video


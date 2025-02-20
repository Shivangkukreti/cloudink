require('dotenv').config()
const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');

cloudinary.config({
    cloud_name:process.env.cloudname,
    api_secret:process.env.apisecret,
    api_key:process.env.apikey
});
const storageimg = new CloudinaryStorage({
cloudinary: cloudinary,
params: {
    folder: 'images',
    allowed_formats: ['jpeg', 'png', 'jpg',],
    resource_type: 'image',
    transformation: [{ width: 800, height: 800, crop: 'limit' }]
}});


const storagevideo = new CloudinaryStorage({
    cloudinary: cloudinary,
    params: {
        folder: 'videos',
        allowed_formats:["mp4"], 
         resource_type: 'video',
        
    }
})

const storageaudio = new CloudinaryStorage({
    cloudinary: cloudinary,
    params: {
        folder: 'audios',
        allowed_formats:["mp3"], 
         resource_type: 'raw',
        
    }
})

module.exports={storagevideo,storageimg,storageaudio}


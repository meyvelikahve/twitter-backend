const mongoose = require('mongoose');
const bcrypt = require('bcryptjs/dist/bcrypt');
const validator = require('validator');
const jwt = require('jsonwebtoken')


const userSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true
    },
    username: {
        type: String,
        required: true,
        trim: true,
        unique: true
    },
    email: {
        type: String,
        unique: true,
        required: true,
        trim: true,
        lowercase: true,
        validate(value){
            if (!validator.isEmail(value)) {
                throw new Error('Invalid Email')
            }
        }
    },
    password: {
        type: String,
        required: true,
        minLength: 7,
        trim: true,
        validate(value){
            if (value.toLowerCase().includes('password')) {
                throw new Error('Password cannot contain "password"')
            }
        }
    },
    tokens: [{
        token: {
            type: String,
            required: true,

        }
    }],
    avatar: {
        type: Buffer,
    },
    avatarExists: {
        type: Boolean,
    },
    bio: {
        type: String
    },
    website: {
        type: String
    },
    location: {
        type: String
    },
    followers: {
        type: Array,
        default: []
    },
    followings: {
        type: Array,
        default: []
    }
})

// The relationship between the tweets and the user
userSchema.virtual('tweets', {
    ref: 'Tweet',
    localField: '_id',
    foreignField: 'user'
})

userSchema.virtual('notificationSent', {
    ref: 'Notification',
    localField: '_id',
    foreignField: 'notSenderId'
})

userSchema.virtual('notificationReceived', {
    ref: 'Notification',
    localField: '_id',
    foreignField: 'notReceiverId'
})

// hash the password
userSchema.pre('save', async function(next){
    const user = this 

    if(user.isModified('password')){
        user.password = await bcrypt.hash(user.password, 8)
    }

    next()
})

userSchema.methods.generateAuthToken = async function(){
    const user = this

    const token = jwt.sign({ _id : user._id.toString()}, 'twitter-api')

    user.tokens = user.tokens.concat({token})
    await user.save()

    return token
}

// Authentication Check
userSchema.statics.findByCredentials = async (email, password)=> {
    const user = await User.findOne({email})

    if(!user){
        throw new Error('Email cant find')
    }

    const isMatch = await bcrypt.compare(password, user.password)

    if(!isMatch){
        throw new Error('Password does not match')
    }

    return user
}

const User = mongoose.model('User', userSchema)

module.exports = User
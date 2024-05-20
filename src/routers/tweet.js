const express = require('express')
const multer = require('multer')
const sharp = require('sharp')


const Tweet = require('../models/tweet')


const router = new express.Router()

const auth = require('../middleware/auth')

// Helpers

const upload = multer({
    limits: {
        fileSize: 10000000
    }
})

// Fetch Tweets
router.get('/tweets', async (req, res) => {
    try {
        const tweets = await Tweet.find({})
        res.send(tweets)
    } catch (error) {
        res.status(500).send(error)
    }
})

// Fetch User's tweets
router.get('/tweets/:id', async (req, res) => {
    const _id = req.params.id

    try {
        const tweets = await Tweet.find({ user: _id})

        if(!tweets){
            return res.status(404).send()
        }

        res.send(tweets)
    } catch (error) {
        res.status(500).send(error)
    }
})

// Post Tweet
router.post('/tweets', auth, async (req, res) => {
    const tweet = new Tweet({
        ...req.body,
        user: req.user._id,
        userId: req.user._id,
        username: req.user.username
    })

    try {
        await tweet.save()
        res.status(201).send(tweet)
    } catch (error) {
        res.status(400).send(error)
    }
})

// Add Image to Tweet
router.post('/uploadTweetImage/:id', auth, upload.single('upload'), async (req, res) => {
    const tweet = await Tweet.findOne({ _id: req.params.id })

    if (!tweet) {
        throw new Error('Cannot find the tweet')
    }

    const buffer = await sharp(req.file.buffer).resize({ width: 350, height: 350 }).toBuffer()
    tweet.image = buffer
    await tweet.save()
    res.send(tweet)

}, (error, req, res, next) => {
    res.status(400).send({ error: error.message })
})

// Fetch Tweet Image
router.get('/tweets/:id/image', async (req, res) => {
    try {
        const tweet = await Tweet.findById(req.params.id)

        if (!tweet && !tweet.image) {
            throw new Error('Tweet image doesnt exist')
        }

        res.set('Content-Type', 'image/jpg')
        res.send(tweet.image)

    } catch (error) {
        res.status(404).send(error)
    }
})

// Like Tweet
router.put('/tweets/:id/like', auth, async (req, res) => {
    try {
        const tweet = await Tweet.findById(req.params.id)
        if (!tweet.likes.includes(req.user.id)) {
            await tweet.updateOne({ $push: { likes: req.user.id } })
            res.status(200).json("Tweet has been liked")
        } else {
            res.status(403).json('You have already liked this tweet')
        }
    } catch (error) {
        res.status(500).json(error)
    }
})

// Unlike Tweet
router.put('/tweets/:id/unlike', auth, async (req, res) => {
    try {
        const tweet = await Tweet.findById(req.params.id)
        if (tweet.likes.includes(req.user.id)) {
            await tweet.updateOne( { $pull: {likes: req.user.id}})
            res.status(200).json('Tweet has been unliked')
        } else {
            res.status(403).json('you have already unliked this tweet')
        }
    } catch (error) {
        res.status(500).json(error)
    }
})



module.exports = router
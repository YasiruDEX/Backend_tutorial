const bodyParser = require('body-parser')
const express = require('express')
const { mongo, default: mongoose } = require('mongoose')
const app = express()
const port = 3000

app.use(bodyParser.json())

mongoose.connect('mongodb://mongo:27017/users').then(() => { 
    console.log('Connected to MongoDB')
}).catch(err => {
    console.error('Failed to connect to MongoDB', err)
})

const userSchema = new mongoose.Schema({
    name: String,
    email: String
})

const User = mongoose.model('User', userSchema)

app.get('/users', async (req, res) => {
    try {
        const users = await User.find();
        res.json(users);
    } catch (error) {
        res.status(500).send(error);
    }
});

app.post('/users', async (req, res) => {
    const {name, email} = req.body;
    try {
        const user = new User({name, email});
        await user.save();
        res.status(201).send(user);
    } catch (error) {
        res.status(500).send(error);
    }
});

app.get('/', (req, res) => {
  res.send('Hello World!')
})

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`)
})
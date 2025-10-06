const bodyParser = require('body-parser')
const express = require('express')
const { mongo, default: mongoose } = require('mongoose')
const app = express()
const port = 3001

app.use(bodyParser.json())

mongoose.connect('mongodb://mongo:27017/tasks').then(() => { 
    console.log('Connected to MongoDB')
}).catch(err => {
    console.error('Failed to connect to MongoDB', err)
})

const taskSchema = new mongoose.Schema({
    title: String,
    description: String,
    userId: String,
    createdAt: { 
        type: Date, 
        default: Date.now 
    }
})

const Task = mongoose.model('Task', taskSchema)

app.post('/tasks', async (req, res) => {
    const {title, description, userId} = req.body;
    try {
        const task = new Task({title, description, userId});
        await task.save();
        res.status(201).send(task);
    } catch (error) {
        res.status(500).send(error);
    }
});

app.get('/tasks', async (req, res) => {
    try {
        const tasks = await Task.find();
        res.json(tasks);
    } catch (error) {
        res.status(500).send(error);
    }
});

app.listen(port, () => {
  console.log(`Task Service app listening on port ${port}`)
})


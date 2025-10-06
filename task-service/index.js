const bodyParser = require('body-parser')
const express = require('express')
const { mongo, default: mongoose } = require('mongoose')
const app = express()
const port = 3001
const amqp = require('amqplib');

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

let channel, connection;

async function connectRabbitMQwithRetry( 
    retries = 5,
    delay = 3000
) {
    while (retries) {
        try {
            connection = await amqp.connect('amqp://rabbitmq:5672');
            channel = await connection.createChannel();
            await channel.assertQueue('task_created');
            console.log('Connected to RabbitMQ');
            break; // Break only on successful connection
        } catch (error) {
            console.error('Failed to connect to RabbitMQ', error);
            retries--;
            console.log(`Retries left: ${retries}`);
            if (retries === 0) {
                console.error('Failed to connect to RabbitMQ after all retries');
                break;
            }
            await new Promise(res => setTimeout(res, delay));
        }
    }
}

app.post('/tasks', async (req, res) => {
    const {title, description, userId} = req.body;
    try {
        const task = new Task({title, description, userId});
        await task.save();

        const message = {
            id: task._id,
            userId: task.userId,
            title: task.title,
        };

        if (!channel) {
            return res.status(500).send('RabbitMQ channel is not established');
        }

        channel.sendToQueue('task_created', Buffer.from(JSON.stringify(message)));
        console.log('Task created event sent to RabbitMQ');

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
    connectRabbitMQwithRetry();
})


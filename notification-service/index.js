const amqp = require('amqplib');

async function start() {
    try {
        const connection = await amqp.connect('amqp://rabbitmq:5672');
        const channel = await connection.createChannel();
        await channel.assertQueue('task_created');
        console.log('Notification Service connected to RabbitMQ');

        channel.consume('task_created', msg => {
            if (msg !== null) {
                const messageContent = msg.content.toString();
                const task = JSON.parse(messageContent);
                console.log(`New Task Created: [ID: ${task.id}, Title: ${task.title}, UserID: ${task.userId}]`);
                channel.ack(msg);
            }
        });
    } catch (error) {
        console.error('Failed to connect to RabbitMQ', error);
    }
}

start();
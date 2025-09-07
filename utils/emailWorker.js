const emailQueue = require("./emailQueue");

emailQueue.on('completed', (job, result) => {
  console.log(`Email job ${job.id} completed: ${result.messageId}`);
});

emailQueue.on('failed', (job, err) => {
  console.error(`Email job ${job.id} failed:`, err);
});

// Keep the process running
console.log('Email worker running...');

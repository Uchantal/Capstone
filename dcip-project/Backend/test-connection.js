#!/usr/bin/env node
// Direct Node.js test (no TypeScript compilation)
require('dotenv').config();

const mongoose = require('mongoose');

console.log('=== MongoDB Connection Test ===\n');
console.log('1. Environment Variables:');
console.log(`   MONGO_URI: ${process.env.MONGO_URI || 'NOT FOUND'}`);
console.log(`   JWT_SECRET: ${process.env.JWT_SECRET ? '✓ Loaded' : '✗ NOT FOUND'}`);
console.log(`   PORT: ${process.env.PORT || 'NOT FOUND'}`);

if (!process.env.MONGO_URI) {
  console.error('\n✗ ERROR: MONGO_URI not found in environment variables!');
  process.exit(1);
}

console.log('\n2. Attempting connection...');
const connectionString = process.env.MONGO_URI;

// Set extended timeout for initial diagnosis
const connectOptions = {
  connectTimeoutMS: 10000,
  socketTimeoutMS: 10000,
  serverSelectionTimeoutMS: 10000,
  retryWrites: true,
  w: 'majority',
};

mongoose.connect(connectionString, connectOptions)
  .then(() => {
    console.log('✓ MongoDB connected successfully!');
    console.log(`   Connected to: ${mongoose.connection.host}:${mongoose.connection.port}`);
    console.log(`   Database: ${mongoose.connection.db.name}`);
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n✗ Connection failed!');
    console.error(`\nError Type: ${error.name}`);
    console.error(`Message: ${error.message}`);
    
    // Provide specific guidance
    if (error.message.includes('ENOTFOUND')) {
      console.error('\n→ This is a DNS resolution issue. The hostname cannot be resolved.');
      console.error('  Check: Network connectivity, firewall, or try using IP directly.');
    } else if (error.message.includes('ETIMEDOUT') || error.message.includes('ERR_CONNECTION_REFUSED')) {
      console.error('\n→ Connection timeout. The server is not responding.');
      console.error('  Check: MongoDB Atlas cluster status, IP whitelist (need 0.0.0.0/0).');
    } else if (error.message.includes('authentication failed')) {
      console.error('\n→ Authentication failed. Invalid credentials.');
      console.error('  Check: Username and password in MONGO_URI.');
    }
    
    console.error(`\nFull error:\n`, error);
    process.exit(1);
  });

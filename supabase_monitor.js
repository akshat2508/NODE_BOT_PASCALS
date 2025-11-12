// const axios = require('axios');
// const fs = require('fs');
// const path = require('path');
// require('dotenv').config();

// // Configuration from environment variables
// const SUPABASE_URL = process.env.SUPABASE_URL;
// const SUPABASE_KEY = process.env.SUPABASE_KEY;
// const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
// const TELEGRAM_CHAT_ID = process.env.TELEGRAM_CHAT_ID;

// // Monitoring configuration
// const CHECK_INTERVAL = 60000; // 60 seconds in milliseconds
// const MAX_RETRIES = 3;
// const REQUEST_TIMEOUT = 10000; // 10 seconds

// // Daily report configuration (9:00 AM)
// const DAILY_REPORT_HOUR = 9;
// const DAILY_REPORT_MINUTE = 0;

// class Logger {
//   constructor(logFile = 'supabase_monitor.log') {
//     this.logFile = logFile;
//   }

//   log(level, message) {
//     const timestamp = new Date().toISOString();
//     const logMessage = `${timestamp} - ${level} - ${message}\n`;
    
//     // Write to file
//     fs.appendFileSync(this.logFile, logMessage);
    
//     // Write to console
//     console.log(logMessage.trim());
//   }

//   info(message) {
//     this.log('INFO', message);
//   }

//   error(message) {
//     this.log('ERROR', message);
//   }

//   warning(message) {
//     this.log('WARNING', message);
//   }
// }

// class SupabaseMonitor {
//   constructor() {
//     this.logger = new Logger();
//     this.lastStatus = null;
//     this.consecutiveFailures = 0;
//     this.lastDailyReportDate = null;
//     this.dailyStats = this.getInitialDailyStats();
//     this.headers = {
//       'apikey': SUPABASE_KEY,
//       'Authorization': `Bearer ${SUPABASE_KEY}`,
//       'Content-Type': 'application/json'
//     };
//   }

//   getInitialDailyStats() {
//     return {
//       checksToday: 0,
//       errorsToday: 0,
//       warningsToday: 0,
//       totalDowntimeMinutes: 0,
//       averageResponseTime: 0,
//       responseTimes: []
//     };
//   }

//   resetDailyStats() {
//     this.dailyStats = this.getInitialDailyStats();
//     this.logger.info('Daily statistics reset');
//   }

//   updateDailyStats(healthStatus) {
//     this.dailyStats.checksToday++;
    
//     if (healthStatus.status === 'error') {
//       this.dailyStats.errorsToday++;
//       this.dailyStats.totalDowntimeMinutes += CHECK_INTERVAL / 60000;
//     } else if (healthStatus.status === 'warning') {
//       this.dailyStats.warningsToday++;
//     }
    
//     if (healthStatus.responseTime) {
//       this.dailyStats.responseTimes.push(healthStatus.responseTime);
//       const sum = this.dailyStats.responseTimes.reduce((a, b) => a + b, 0);
//       this.dailyStats.averageResponseTime = sum / this.dailyStats.responseTimes.length;
//     }
//   }

//   shouldSendDailyReport() {
//     const now = new Date();
//     const currentDate = now.toDateString();
//     const currentHour = now.getHours();
//     const currentMinute = now.getMinutes();
    
//     // Check if it's a new day and we haven't sent today's report yet
//     if (this.lastDailyReportDate !== currentDate &&
//         currentHour >= DAILY_REPORT_HOUR &&
//         (currentHour > DAILY_REPORT_HOUR || currentMinute >= DAILY_REPORT_MINUTE)) {
//       return true;
//     }
//     return false;
//   }

//   async sendTelegramAlert(message, severity = 'ERROR') {
//     try {
//       let emoji = '🚨';
//       if (severity === 'ERROR') emoji = '🚨';
//       else if (severity === 'WARNING') emoji = '⚠️';
//       else if (severity === 'INFO') emoji = 'ℹ️';
//       else if (severity === 'DAILY_SUCCESS') emoji = '✅';
      
//       const timestamp = new Date().toLocaleString('en-US', {
//         year: 'numeric',
//         month: '2-digit',
//         day: '2-digit',
//         hour: '2-digit',
//         minute: '2-digit',
//         second: '2-digit',
//         hour12: false
//       });
      
//       const formattedMessage = `${emoji} *Supabase Monitor Alert*\n\n` +
//         `*Severity:* ${severity}\n` +
//         `*Time:* ${timestamp}\n\n` +
//         `*Details:*\n${message}`;
      
//       const telegramUrl = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`;
      
//       const response = await axios.post(telegramUrl, {
//         chat_id: TELEGRAM_CHAT_ID,
//         text: formattedMessage,
//         parse_mode: 'Markdown'
//       }, {
//         timeout: REQUEST_TIMEOUT
//       });
      
//       this.logger.info(`Telegram alert sent successfully: ${severity}`);
      
//     } catch (error) {
//       this.logger.error(`Failed to send Telegram alert: ${error.message}`);
//     }
//   }

//   async sendDailySuccessReport() {
//     const uptimePercentage = 100 - (this.dailyStats.errorsToday / Math.max(this.dailyStats.checksToday, 1) * 100);
    
//     const currentDate = new Date().toLocaleDateString('en-US', {
//       year: 'numeric',
//       month: '2-digit',
//       day: '2-digit'
//     });
    
//     let message = `🌅 *Daily Supabase Status Report*\n\n`;
//     message += `*Date:* ${currentDate}\n`;
//     message += `*Overall Status:* ${this.lastStatus === 'healthy' ? '🟢 HEALTHY' : '🔴 ISSUES DETECTED'}\n\n`;
    
//     message += `*24-Hour Statistics:*\n`;
//     message += `• Health checks performed: ${this.dailyStats.checksToday}\n`;
//     message += `• Uptime: ${uptimePercentage.toFixed(1)}%\n`;
//     message += `• Errors detected: ${this.dailyStats.errorsToday}\n`;
//     message += `• Warnings: ${this.dailyStats.warningsToday}\n`;
    
//     if (this.dailyStats.totalDowntimeMinutes > 0) {
//       message += `• Total downtime: ${this.dailyStats.totalDowntimeMinutes.toFixed(1)} minutes\n`;
//     }
    
//     if (this.dailyStats.averageResponseTime > 0) {
//       message += `• Average response time: ${this.dailyStats.averageResponseTime.toFixed(1)}ms\n`;
//     }
    
//     message += `\n*Current Status:* All systems operational ✅`;
    
//     await this.sendTelegramAlert(message, 'DAILY_SUCCESS');
//     this.lastDailyReportDate = new Date().toDateString();
    
//     // Reset daily stats for the new day
//     this.resetDailyStats();
//   }

//   async checkSupabaseHealth() {
//     const healthStatus = {
//       status: 'unknown',
//       responseTime: null,
//       errorMessage: null,
//       statusCode: null
//     };
    
//     try {
//       const startTime = Date.now();
//       const testUrl = `${SUPABASE_URL}/rest/v1/`;
      
//       const response = await axios.get(testUrl, {
//         headers: this.headers,
//         timeout: REQUEST_TIMEOUT
//       });
      
//       const responseTime = Date.now() - startTime;
//       healthStatus.responseTime = Math.round(responseTime);
//       healthStatus.statusCode = response.status;
      
//       // Check for various error conditions
//       if (response.status === 200) {
//         healthStatus.status = 'healthy';
//       } else if (response.status >= 500) {
//         healthStatus.status = 'error';
//         healthStatus.errorMessage = `Internal server error: ${response.status}`;
//       } else if (response.status === 401) {
//         healthStatus.status = 'error';
//         healthStatus.errorMessage = 'Authentication failed - check your API key';
//       } else if (response.status === 403) {
//         healthStatus.status = 'error';
//         healthStatus.errorMessage = 'Access forbidden - check permissions';
//       } else if (response.status >= 400) {
//         healthStatus.status = 'warning';
//         healthStatus.errorMessage = `Client error: ${response.status}`;
//       } else {
//         healthStatus.status = 'warning';
//         healthStatus.errorMessage = `Unexpected status code: ${response.status}`;
//       }
      
//     } catch (error) {
//       healthStatus.status = 'error';
      
//       if (error.code === 'ECONNABORTED' || error.message.includes('timeout')) {
//         healthStatus.errorMessage = `Request timeout after ${REQUEST_TIMEOUT / 1000} seconds`;
//       } else if (error.code === 'ECONNREFUSED' || error.code === 'ENOTFOUND') {
//         healthStatus.errorMessage = 'Connection error - unable to reach Supabase';
//       } else if (error.response) {
//         healthStatus.statusCode = error.response.status;
//         healthStatus.errorMessage = `Request error: ${error.response.status} - ${error.response.statusText}`;
//       } else {
//         healthStatus.errorMessage = `Unexpected error: ${error.message}`;
//       }
//     }
    
//     return healthStatus;
//   }

//   async checkSpecificEndpoints() {
//     const endpointsStatus = {};
    
//     const endpoints = [
//       { name: 'Auth', url: `${SUPABASE_URL}/auth/v1/health` },
//       { name: 'Realtime', url: `${SUPABASE_URL}/realtime/v1/health` },
//       { name: 'Storage', url: `${SUPABASE_URL}/storage/v1/health` }
//     ];
    
//     for (const endpoint of endpoints) {
//       try {
//         const response = await axios.get(endpoint.url, {
//           headers: this.headers,
//           timeout: REQUEST_TIMEOUT
//         });
        
//         endpointsStatus[endpoint.name] = {
//           status: response.status === 200 ? 'healthy' : 'error',
//           statusCode: response.status,
//           error: response.status === 200 ? null : `HTTP ${response.status}`
//         };
        
//       } catch (error) {
//         endpointsStatus[endpoint.name] = {
//           status: 'error',
//           statusCode: error.response ? error.response.status : null,
//           error: error.message
//         };
//       }
//     }
    
//     return endpointsStatus;
//   }

//   async monitorLoop() {
//     this.logger.info('Starting Supabase monitoring...');
//     await this.sendTelegramAlert('Supabase monitoring started successfully!', 'INFO');
    
//     const runCheck = async () => {
//       try {
//         // Check if it's time to send daily report
//         if (this.shouldSendDailyReport() && this.lastStatus === 'healthy') {
//           await this.sendDailySuccessReport();
//         }
        
//         // Check main API health
//         const healthStatus = await this.checkSupabaseHealth();
        
//         // Update daily statistics
//         this.updateDailyStats(healthStatus);
        
//         // Check specific endpoints
//         const endpointsStatus = await this.checkSpecificEndpoints();
        
//         const currentStatus = healthStatus.status;
        
//         // Alert logic
//         if (currentStatus === 'error') {
//           this.consecutiveFailures++;
          
//           // Send alert on first failure or every 5th consecutive failure
//           if (this.consecutiveFailures === 1 || this.consecutiveFailures % 5 === 0) {
//             let message = `Supabase API is DOWN!\n\n`;
//             message += `Error: ${healthStatus.errorMessage}\n`;
//             message += `Status Code: ${healthStatus.statusCode || 'N/A'}\n`;
//             message += `Consecutive failures: ${this.consecutiveFailures}\n\n`;
            
//             // Add endpoint details if available
//             const failedEndpoints = Object.keys(endpointsStatus).filter(
//               name => endpointsStatus[name].status === 'error'
//             );
//             if (failedEndpoints.length > 0) {
//               message += `Failed endpoints: ${failedEndpoints.join(', ')}`;
//             }
            
//             await this.sendTelegramAlert(message, 'ERROR');
//           }
          
//         } else if (currentStatus === 'warning') {
//           let message = `Supabase API Warning!\n\n`;
//           message += `Issue: ${healthStatus.errorMessage}\n`;
//           message += `Status Code: ${healthStatus.statusCode || 'N/A'}\n`;
//           message += `Response Time: ${healthStatus.responseTime || 'N/A'}ms`;
          
//           await this.sendTelegramAlert(message, 'WARNING');
//           this.consecutiveFailures = 0;
          
//         } else { // healthy
//           // Send recovery alert if we were previously failing
//           if ((this.lastStatus === 'error' || this.lastStatus === 'warning') && currentStatus === 'healthy') {
//             let message = `Supabase API is back online! ✅\n\n`;
//             message += `Response Time: ${healthStatus.responseTime || 'N/A'}ms\n`;
//             message += `Previous consecutive failures: ${this.consecutiveFailures}`;
            
//             await this.sendTelegramAlert(message, 'INFO');
//           }
          
//           this.consecutiveFailures = 0;
//         }
        
//         this.lastStatus = currentStatus;
        
//         // Log current status
//         let logMessage = `Status: ${currentStatus}`;
//         if (healthStatus.responseTime) {
//           logMessage += `, Response time: ${healthStatus.responseTime}ms`;
//         }
//         if (healthStatus.errorMessage) {
//           logMessage += `, Error: ${healthStatus.errorMessage}`;
//         }
        
//         this.logger.info(logMessage);
        
//       } catch (error) {
//         this.logger.error(`Unexpected error in monitoring loop: ${error.message}`);
//         await this.sendTelegramAlert(`Monitor error: ${error.message}`, 'ERROR');
//       }
//     };
    
//     // Run first check immediately
//     await runCheck();
    
//     // Then run checks at regular intervals
//     this.intervalId = setInterval(runCheck, CHECK_INTERVAL);
//   }

//   stop() {
//     if (this.intervalId) {
//       clearInterval(this.intervalId);
//       this.logger.info('Monitoring stopped');
//       this.sendTelegramAlert('Supabase monitoring stopped', 'INFO');
//     }
//   }
// }

// function validateConfig() {
//   const errors = [];
  
//   if (!SUPABASE_URL || SUPABASE_URL === 'your_supabase_url_here') {
//     errors.push('SUPABASE_URL is not configured');
//   }
  
//   if (!SUPABASE_KEY || SUPABASE_KEY === 'your_supabase_anon_key_here') {
//     errors.push('SUPABASE_KEY is not configured');
//   }
  
//   if (!TELEGRAM_BOT_TOKEN || TELEGRAM_BOT_TOKEN === 'your_telegram_bot_token_here') {
//     errors.push('TELEGRAM_BOT_TOKEN is not configured');
//   }
  
//   if (!TELEGRAM_CHAT_ID || TELEGRAM_CHAT_ID === 'your_telegram_chat_id_here') {
//     errors.push('TELEGRAM_CHAT_ID is not configured');
//   }
  
//   if (errors.length > 0) {
//     console.error('Configuration errors found:');
//     errors.forEach(error => console.error(`- ${error}`));
//     process.exit(1);
//   }
// }

// // Main execution
// if (require.main === module) {
//   // Validate configuration
//   validateConfig();
  
//   // Create and start monitor
//   const monitor = new SupabaseMonitor();
//   monitor.monitorLoop();
  
//   // Handle graceful shutdown
//   process.on('SIGINT', () => {
//     console.log('\nMonitoring stopped by user');
//     monitor.stop();
//     process.exit(0);
//   });
  
//   process.on('SIGTERM', () => {
//     console.log('\nMonitoring stopped by system');
//     monitor.stop();
//     process.exit(0);
//   });
// }

const axios = require('axios');
const fs = require('fs');
const path = require('path');
const http = require('http');
require('dotenv').config();

// Configuration from environment variables
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_KEY;
const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const TELEGRAM_CHAT_ID = process.env.TELEGRAM_CHAT_ID;
const PORT = process.env.PORT || 3000;

// Monitoring configuration
const CHECK_INTERVAL = 60000; // 60 seconds in milliseconds
const MAX_RETRIES = 3;
const REQUEST_TIMEOUT = 10000; // 10 seconds

// Daily report configuration (9:00 AM)
const DAILY_REPORT_HOUR = 9;
const DAILY_REPORT_MINUTE = 0;

class Logger {
  constructor(logFile = 'supabase_monitor.log') {
    this.logFile = logFile;
  }

  log(level, message) {
    const timestamp = new Date().toISOString();
    const logMessage = `${timestamp} - ${level} - ${message}\n`;
    
    // Write to file
    fs.appendFileSync(this.logFile, logMessage);
    
    // Write to console
    console.log(logMessage.trim());
  }

  info(message) {
    this.log('INFO', message);
  }

  error(message) {
    this.log('ERROR', message);
  }

  warning(message) {
    this.log('WARNING', message);
  }
}

class SupabaseMonitor {
  constructor() {
    this.logger = new Logger();
    this.lastStatus = null;
    this.consecutiveFailures = 0;
    this.lastDailyReportDate = null;
    this.dailyStats = this.getInitialDailyStats();
    this.headers = {
      'apikey': SUPABASE_KEY,
      'Authorization': `Bearer ${SUPABASE_KEY}`,
      'Content-Type': 'application/json'
    };
  }

  getInitialDailyStats() {
    return {
      checksToday: 0,
      errorsToday: 0,
      warningsToday: 0,
      totalDowntimeMinutes: 0,
      averageResponseTime: 0,
      responseTimes: []
    };
  }

  resetDailyStats() {
    this.dailyStats = this.getInitialDailyStats();
    this.logger.info('Daily statistics reset');
  }

  updateDailyStats(healthStatus) {
    this.dailyStats.checksToday++;
    
    if (healthStatus.status === 'error') {
      this.dailyStats.errorsToday++;
      this.dailyStats.totalDowntimeMinutes += CHECK_INTERVAL / 60000;
    } else if (healthStatus.status === 'warning') {
      this.dailyStats.warningsToday++;
    }
    
    if (healthStatus.responseTime) {
      this.dailyStats.responseTimes.push(healthStatus.responseTime);
      const sum = this.dailyStats.responseTimes.reduce((a, b) => a + b, 0);
      this.dailyStats.averageResponseTime = sum / this.dailyStats.responseTimes.length;
    }
  }

  shouldSendDailyReport() {
    const now = new Date();
    const currentDate = now.toDateString();
    const currentHour = now.getHours();
    const currentMinute = now.getMinutes();
    
    // Check if it's a new day and we haven't sent today's report yet
    if (this.lastDailyReportDate !== currentDate &&
        currentHour >= DAILY_REPORT_HOUR &&
        (currentHour > DAILY_REPORT_HOUR || currentMinute >= DAILY_REPORT_MINUTE)) {
      return true;
    }
    return false;
  }

  async sendTelegramAlert(message, severity = 'ERROR') {
    try {
      let emoji = '🚨';
      if (severity === 'ERROR') emoji = '🚨';
      else if (severity === 'WARNING') emoji = '⚠️';
      else if (severity === 'INFO') emoji = 'ℹ️';
      else if (severity === 'DAILY_SUCCESS') emoji = '✅';
      
      const timestamp = new Date().toLocaleString('en-US', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false
      });
      
      const formattedMessage = `${emoji} *Supabase Monitor Alert*\n\n` +
        `*Severity:* ${severity}\n` +
        `*Time:* ${timestamp}\n\n` +
        `*Details:*\n${message}`;
      
      const telegramUrl = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`;
      
      const response = await axios.post(telegramUrl, {
        chat_id: TELEGRAM_CHAT_ID,
        text: formattedMessage,
        parse_mode: 'Markdown'
      }, {
        timeout: REQUEST_TIMEOUT
      });
      
      this.logger.info(`Telegram alert sent successfully: ${severity}`);
      
    } catch (error) {
      this.logger.error(`Failed to send Telegram alert: ${error.message}`);
    }
  }

  async sendDailySuccessReport() {
    const uptimePercentage = 100 - (this.dailyStats.errorsToday / Math.max(this.dailyStats.checksToday, 1) * 100);
    
    const currentDate = new Date().toLocaleDateString('en-US', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    });
    
    let message = `🌅 *Daily Supabase Status Report*\n\n`;
    message += `*Date:* ${currentDate}\n`;
    message += `*Overall Status:* ${this.lastStatus === 'healthy' ? '🟢 HEALTHY' : '🔴 ISSUES DETECTED'}\n\n`;
    
    message += `*24-Hour Statistics:*\n`;
    message += `• Health checks performed: ${this.dailyStats.checksToday}\n`;
    message += `• Uptime: ${uptimePercentage.toFixed(1)}%\n`;
    message += `• Errors detected: ${this.dailyStats.errorsToday}\n`;
    message += `• Warnings: ${this.dailyStats.warningsToday}\n`;
    
    if (this.dailyStats.totalDowntimeMinutes > 0) {
      message += `• Total downtime: ${this.dailyStats.totalDowntimeMinutes.toFixed(1)} minutes\n`;
    }
    
    if (this.dailyStats.averageResponseTime > 0) {
      message += `• Average response time: ${this.dailyStats.averageResponseTime.toFixed(1)}ms\n`;
    }
    
    message += `\n*Current Status:* All systems operational ✅`;
    
    await this.sendTelegramAlert(message, 'DAILY_SUCCESS');
    this.lastDailyReportDate = new Date().toDateString();
    
    // Reset daily stats for the new day
    this.resetDailyStats();
  }

  async checkSupabaseHealth() {
    const healthStatus = {
      status: 'unknown',
      responseTime: null,
      errorMessage: null,
      statusCode: null
    };
    
    try {
      const startTime = Date.now();
      const testUrl = `${SUPABASE_URL}/rest/v1/`;
      
      const response = await axios.get(testUrl, {
        headers: this.headers,
        timeout: REQUEST_TIMEOUT
      });
      
      const responseTime = Date.now() - startTime;
      healthStatus.responseTime = Math.round(responseTime);
      healthStatus.statusCode = response.status;
      
      // Check for various error conditions
      if (response.status === 200) {
        healthStatus.status = 'healthy';
      } else if (response.status >= 500) {
        healthStatus.status = 'error';
        healthStatus.errorMessage = `Internal server error: ${response.status}`;
      } else if (response.status === 401) {
        healthStatus.status = 'error';
        healthStatus.errorMessage = 'Authentication failed - check your API key';
      } else if (response.status === 403) {
        healthStatus.status = 'error';
        healthStatus.errorMessage = 'Access forbidden - check permissions';
      } else if (response.status >= 400) {
        healthStatus.status = 'warning';
        healthStatus.errorMessage = `Client error: ${response.status}`;
      } else {
        healthStatus.status = 'warning';
        healthStatus.errorMessage = `Unexpected status code: ${response.status}`;
      }
      
    } catch (error) {
      healthStatus.status = 'error';
      
      if (error.code === 'ECONNABORTED' || error.message.includes('timeout')) {
        healthStatus.errorMessage = `Request timeout after ${REQUEST_TIMEOUT / 1000} seconds`;
      } else if (error.code === 'ECONNREFUSED' || error.code === 'ENOTFOUND') {
        healthStatus.errorMessage = 'Connection error - unable to reach Supabase';
      } else if (error.response) {
        healthStatus.statusCode = error.response.status;
        healthStatus.errorMessage = `Request error: ${error.response.status} - ${error.response.statusText}`;
      } else {
        healthStatus.errorMessage = `Unexpected error: ${error.message}`;
      }
    }
    
    return healthStatus;
  }

  async checkSpecificEndpoints() {
    const endpointsStatus = {};
    
    const endpoints = [
      { name: 'Auth', url: `${SUPABASE_URL}/auth/v1/health` },
      { name: 'Realtime', url: `${SUPABASE_URL}/realtime/v1/health` },
      { name: 'Storage', url: `${SUPABASE_URL}/storage/v1/health` }
    ];
    
    for (const endpoint of endpoints) {
      try {
        const response = await axios.get(endpoint.url, {
          headers: this.headers,
          timeout: REQUEST_TIMEOUT
        });
        
        endpointsStatus[endpoint.name] = {
          status: response.status === 200 ? 'healthy' : 'error',
          statusCode: response.status,
          error: response.status === 200 ? null : `HTTP ${response.status}`
        };
        
      } catch (error) {
        endpointsStatus[endpoint.name] = {
          status: 'error',
          statusCode: error.response ? error.response.status : null,
          error: error.message
        };
      }
    }
    
    return endpointsStatus;
  }

  async monitorLoop() {
    this.logger.info('Starting Supabase monitoring...');
    await this.sendTelegramAlert('Supabase monitoring started successfully!', 'INFO');
    
    const runCheck = async () => {
      try {
        // Check if it's time to send daily report
        if (this.shouldSendDailyReport() && this.lastStatus === 'healthy') {
          await this.sendDailySuccessReport();
        }
        
        // Check main API health
        const healthStatus = await this.checkSupabaseHealth();
        
        // Update daily statistics
        this.updateDailyStats(healthStatus);
        
        // Check specific endpoints
        const endpointsStatus = await this.checkSpecificEndpoints();
        
        const currentStatus = healthStatus.status;
        
        // Alert logic
        if (currentStatus === 'error') {
          this.consecutiveFailures++;
          
          // Send alert on first failure or every 5th consecutive failure
          if (this.consecutiveFailures === 1 || this.consecutiveFailures % 5 === 0) {
            let message = `Supabase API is DOWN!\n\n`;
            message += `Error: ${healthStatus.errorMessage}\n`;
            message += `Status Code: ${healthStatus.statusCode || 'N/A'}\n`;
            message += `Consecutive failures: ${this.consecutiveFailures}\n\n`;
            
            // Add endpoint details if available
            const failedEndpoints = Object.keys(endpointsStatus).filter(
              name => endpointsStatus[name].status === 'error'
            );
            if (failedEndpoints.length > 0) {
              message += `Failed endpoints: ${failedEndpoints.join(', ')}`;
            }
            
            await this.sendTelegramAlert(message, 'ERROR');
          }
          
        } else if (currentStatus === 'warning') {
          let message = `Supabase API Warning!\n\n`;
          message += `Issue: ${healthStatus.errorMessage}\n`;
          message += `Status Code: ${healthStatus.statusCode || 'N/A'}\n`;
          message += `Response Time: ${healthStatus.responseTime || 'N/A'}ms`;
          
          await this.sendTelegramAlert(message, 'WARNING');
          this.consecutiveFailures = 0;
          
        } else { // healthy
          // Send recovery alert if we were previously failing
          if ((this.lastStatus === 'error' || this.lastStatus === 'warning') && currentStatus === 'healthy') {
            let message = `Supabase API is back online! ✅\n\n`;
            message += `Response Time: ${healthStatus.responseTime || 'N/A'}ms\n`;
            message += `Previous consecutive failures: ${this.consecutiveFailures}`;
            
            await this.sendTelegramAlert(message, 'INFO');
          }
          
          this.consecutiveFailures = 0;
        }
        
        this.lastStatus = currentStatus;
        
        // Log current status
        let logMessage = `Status: ${currentStatus}`;
        if (healthStatus.responseTime) {
          logMessage += `, Response time: ${healthStatus.responseTime}ms`;
        }
        if (healthStatus.errorMessage) {
          logMessage += `, Error: ${healthStatus.errorMessage}`;
        }
        
        this.logger.info(logMessage);
        
      } catch (error) {
        this.logger.error(`Unexpected error in monitoring loop: ${error.message}`);
        await this.sendTelegramAlert(`Monitor error: ${error.message}`, 'ERROR');
      }
    };
    
    // Run first check immediately
    await runCheck();
    
    // Then run checks at regular intervals
    this.intervalId = setInterval(runCheck, CHECK_INTERVAL);
  }

  stop() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.logger.info('Monitoring stopped');
      this.sendTelegramAlert('Supabase monitoring stopped', 'INFO');
    }
  }
}

function validateConfig() {
  const errors = [];
  
  if (!SUPABASE_URL || SUPABASE_URL === 'your_supabase_url_here') {
    errors.push('SUPABASE_URL is not configured');
  }
  
  if (!SUPABASE_KEY || SUPABASE_KEY === 'your_supabase_anon_key_here') {
    errors.push('SUPABASE_KEY is not configured');
  }
  
  if (!TELEGRAM_BOT_TOKEN || TELEGRAM_BOT_TOKEN === 'your_telegram_bot_token_here') {
    errors.push('TELEGRAM_BOT_TOKEN is not configured');
  }
  
  if (!TELEGRAM_CHAT_ID || TELEGRAM_CHAT_ID === 'your_telegram_chat_id_here') {
    errors.push('TELEGRAM_CHAT_ID is not configured');
  }
  
  if (errors.length > 0) {
    console.error('Configuration errors found:');
    errors.forEach(error => console.error(`- ${error}`));
    process.exit(1);
  }
}

// Main execution
if (require.main === module) {
  // Validate configuration
  validateConfig();
  
  // Create and start monitor
  const monitor = new SupabaseMonitor();
  monitor.monitorLoop();
  
  // Handle graceful shutdown
  process.on('SIGINT', () => {
    console.log('\nMonitoring stopped by user');
    monitor.stop();
    process.exit(0);
  });
  
  process.on('SIGTERM', () => {
    console.log('\nMonitoring stopped by system');
    monitor.stop();
    process.exit(0);
  });
}
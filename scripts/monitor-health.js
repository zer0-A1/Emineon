#!/usr/bin/env node

const https = require('https');
const fs = require('fs');
const path = require('path');

// Configuration
const HEALTH_ENDPOINT = process.env.HEALTH_ENDPOINT || 'http://localhost:3000/api/health';
const CHECK_INTERVAL = process.env.CHECK_INTERVAL || 60000; // 1 minute
const LOG_FILE = path.join(__dirname, '../logs/health-monitor.log');

// Ensure logs directory exists
const logsDir = path.dirname(LOG_FILE);
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true });
}

class HealthMonitor {
  constructor() {
    this.consecutiveFailures = 0;
    this.lastStatus = null;
    this.startTime = new Date();
  }

  log(level, message, data = {}) {
    const logEntry = {
      timestamp: new Date().toISOString(),
      level,
      message,
      ...data
    };
    
    console.log(`[${logEntry.level}] ${logEntry.message}`, data);
    
    // Append to log file
    fs.appendFileSync(LOG_FILE, JSON.stringify(logEntry) + '\n');
  }

  async checkHealth() {
    try {
      const startTime = Date.now();
      
      const healthData = await this.makeHealthRequest();
      const responseTime = Date.now() - startTime;
      
      if (healthData.success && healthData.status === 'healthy') {
        this.handleHealthyStatus(healthData, responseTime);
      } else {
        this.handleUnhealthyStatus(healthData, responseTime);
      }
      
    } catch (error) {
      this.handleError(error);
    }
  }

  makeHealthRequest() {
    return new Promise((resolve, reject) => {
      const url = new URL(HEALTH_ENDPOINT);
      const options = {
        hostname: url.hostname,
        port: url.port || (url.protocol === 'https:' ? 443 : 80),
        path: url.pathname,
        method: 'GET',
        timeout: 10000,
        headers: {
          'User-Agent': 'Emineon-Health-Monitor/1.0'
        }
      };

      const request = (url.protocol === 'https:' ? https : require('http')).request(options, (response) => {
        let data = '';
        
        response.on('data', (chunk) => {
          data += chunk;
        });
        
        response.on('end', () => {
          try {
            const healthData = JSON.parse(data);
            healthData._statusCode = response.statusCode;
            resolve(healthData);
          } catch (parseError) {
            reject(new Error(`Invalid JSON response: ${parseError.message}`));
          }
        });
      });

      request.on('error', (error) => {
        reject(error);
      });

      request.on('timeout', () => {
        request.destroy();
        reject(new Error('Health check timeout'));
      });

      request.end();
    });
  }

  handleHealthyStatus(healthData, responseTime) {
    const wasDown = this.consecutiveFailures > 0;
    this.consecutiveFailures = 0;
    
    if (wasDown) {
      this.log('INFO', '🟢 Service recovered', {
        responseTime: `${responseTime}ms`,
        databaseLatency: healthData.performance?.databaseLatency,
        services: healthData.services
      });
    } else if (this.shouldLogRoutineCheck()) {
      this.log('INFO', '✅ Health check passed', {
        responseTime: `${responseTime}ms`,
        databaseLatency: healthData.performance?.databaseLatency,
        memoryUsage: healthData.performance?.memoryUsage
      });
    }
    
    this.lastStatus = 'healthy';
  }

  handleUnhealthyStatus(healthData, responseTime) {
    this.consecutiveFailures++;
    
    this.log('WARN', '🟡 Service degraded', {
      consecutiveFailures: this.consecutiveFailures,
      responseTime: `${responseTime}ms`,
      status: healthData.status,
      services: healthData.services,
      statusCode: healthData._statusCode
    });
    
    this.lastStatus = 'degraded';
  }

  handleError(error) {
    this.consecutiveFailures++;
    
    this.log('ERROR', '🔴 Health check failed', {
      consecutiveFailures: this.consecutiveFailures,
      error: error.message,
      errorType: error.constructor.name
    });
    
    // Alert if we've had multiple consecutive failures
    if (this.consecutiveFailures >= 3) {
      this.sendAlert(error);
    }
    
    this.lastStatus = 'error';
  }

  shouldLogRoutineCheck() {
    // Log every 10th check to avoid spam
    const uptimeMinutes = Math.floor((Date.now() - this.startTime.getTime()) / 60000);
    return uptimeMinutes % 10 === 0;
  }

  sendAlert(error) {
    // In production, this would send alerts via email, Slack, etc.
    this.log('CRITICAL', '🚨 ALERT: Service down for multiple checks', {
      consecutiveFailures: this.consecutiveFailures,
      error: error.message,
      endpoint: HEALTH_ENDPOINT
    });
    
    // TODO: Implement actual alerting (email, Slack, PagerDuty, etc.)
  }

  getStats() {
    const uptime = Date.now() - this.startTime.getTime();
    return {
      uptime: `${Math.floor(uptime / 60000)} minutes`,
      lastStatus: this.lastStatus,
      consecutiveFailures: this.consecutiveFailures,
      endpoint: HEALTH_ENDPOINT
    };
  }

  start() {
    this.log('INFO', '🚀 Health monitor started', {
      endpoint: HEALTH_ENDPOINT,
      interval: `${CHECK_INTERVAL / 1000}s`,
      logFile: LOG_FILE
    });
    
    // Initial check
    this.checkHealth();
    
    // Schedule periodic checks
    setInterval(() => {
      this.checkHealth();
    }, CHECK_INTERVAL);

    // Log stats every 5 minutes
    setInterval(() => {
      this.log('INFO', '📊 Monitor stats', this.getStats());
    }, 5 * 60 * 1000);

    // Graceful shutdown
    process.on('SIGINT', () => {
      this.log('INFO', '🛑 Health monitor stopping', this.getStats());
      process.exit(0);
    });
  }
}

// Start monitoring if this script is run directly
if (require.main === module) {
  const monitor = new HealthMonitor();
  monitor.start();
}

module.exports = HealthMonitor; 
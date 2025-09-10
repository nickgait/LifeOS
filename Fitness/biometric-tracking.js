/**
 * Biometric Tracking Module for Fitness Tracker
 * Integrates with various biometric data sources and provides health monitoring
 */

// Biometric Data Manager
class BiometricDataManager {
    constructor() {
        this.biometricData = JSON.parse(localStorage.getItem('biometricData')) || {};
        this.connectedDevices = JSON.parse(localStorage.getItem('connectedDevices')) || {};
        this.lastSync = localStorage.getItem('lastBiometricSync') || null;
    }

    /**
     * Initialize biometric tracking capabilities
     */
    async initialize() {
        try {
            // Check for available APIs
            this.capabilities = await this.checkCapabilities();
            
            // Initialize Web APIs if available
            if (this.capabilities.heartRate) {
                await this.initializeHeartRateAPI();
            }
            
            if (this.capabilities.sensors) {
                await this.initializeSensorAPI();
            }
            
            // Set up periodic sync
            this.setupPeriodicSync();
            
            return this.capabilities;
        } catch (error) {
            ErrorHandler.handle(error, 'Biometric Initialization');
            return this.getBasicCapabilities();
        }
    }

    /**
     * Check what biometric capabilities are available
     */
    async checkCapabilities() {
        const capabilities = {
            heartRate: false,
            sensors: false,
            geolocation: false,
            camera: false,
            microphone: false,
            webBluetooth: false,
            webUSB: false,
            manual: true // Always available
        };

        // Check Web Bluetooth API
        if ('bluetooth' in navigator) {
            capabilities.webBluetooth = true;
        }

        // Check Generic Sensor API
        if ('Accelerometer' in window || 'Gyroscope' in window) {
            capabilities.sensors = true;
        }

        // Check Geolocation API
        if ('geolocation' in navigator) {
            capabilities.geolocation = true;
        }

        // Check Camera API
        if ('mediaDevices' in navigator && 'getUserMedia' in navigator.mediaDevices) {
            capabilities.camera = true;
        }

        // Check for Web HID (for fitness devices)
        if ('hid' in navigator) {
            capabilities.webHID = true;
        }

        return capabilities;
    }

    /**
     * Initialize Heart Rate monitoring (Web Bluetooth)
     */
    async initializeHeartRateAPI() {
        try {
            if (!('bluetooth' in navigator)) {
                throw new Error('Web Bluetooth not supported');
            }

            // This would connect to a Bluetooth heart rate monitor
            // For now, we'll simulate the capability
            console.log('Heart rate monitoring capability available');
            
        } catch (error) {
            console.log('Heart rate monitoring not available:', error.message);
        }
    }

    /**
     * Initialize sensor APIs for movement/activity tracking
     */
    async initializeSensorAPI() {
        try {
            // Check for device motion events (mobile)
            if ('DeviceMotionEvent' in window) {
                await this.requestMotionPermission();
            }

            // Check for Generic Sensor API
            if ('Accelerometer' in window) {
                this.setupAccelerometer();
            }

        } catch (error) {
            console.log('Sensor APIs not available:', error.message);
        }
    }

    /**
     * Request permission for device motion (iOS 13+)
     */
    async requestMotionPermission() {
        try {
            if (typeof DeviceMotionEvent.requestPermission === 'function') {
                const permission = await DeviceMotionEvent.requestPermission();
                if (permission === 'granted') {
                    this.setupMotionTracking();
                }
            } else {
                // Non-iOS devices or older iOS versions
                this.setupMotionTracking();
            }
        } catch (error) {
            console.log('Motion permission denied:', error.message);
        }
    }

    /**
     * Set up device motion tracking
     */
    setupMotionTracking() {
        let lastActivity = 0;
        let stepCount = 0;

        window.addEventListener('devicemotion', (event) => {
            const acceleration = event.accelerationIncludingGravity;
            if (acceleration) {
                const totalAcceleration = Math.sqrt(
                    acceleration.x ** 2 + 
                    acceleration.y ** 2 + 
                    acceleration.z ** 2
                );

                // Simple step detection algorithm
                if (totalAcceleration > 12 && Date.now() - lastActivity > 300) {
                    stepCount++;
                    lastActivity = Date.now();
                    
                    // Store step data
                    this.recordBiometricData('steps', {
                        timestamp: new Date().toISOString(),
                        steps: 1,
                        acceleration: totalAcceleration
                    });
                }
            }
        });
    }

    /**
     * Set up accelerometer (Generic Sensor API)
     */
    setupAccelerometer() {
        try {
            const accelerometer = new Accelerometer({ frequency: 60 });
            
            accelerometer.addEventListener('reading', () => {
                // Process accelerometer data for activity detection
                const magnitude = Math.sqrt(
                    accelerometer.x ** 2 + 
                    accelerometer.y ** 2 + 
                    accelerometer.z ** 2
                );

                // Store activity data
                this.recordBiometricData('activity', {
                    timestamp: new Date().toISOString(),
                    magnitude,
                    x: accelerometer.x,
                    y: accelerometer.y,
                    z: accelerometer.z
                });
            });

            accelerometer.start();
        } catch (error) {
            console.log('Accelerometer not available:', error.message);
        }
    }

    /**
     * Connect to Bluetooth heart rate monitor
     */
    async connectHeartRateMonitor() {
        try {
            const device = await navigator.bluetooth.requestDevice({
                filters: [{
                    services: ['heart_rate']
                }]
            });

            const server = await device.gatt.connect();
            const service = await server.getPrimaryService('heart_rate');
            const characteristic = await service.getCharacteristic('heart_rate_measurement');

            await characteristic.startNotifications();
            
            characteristic.addEventListener('characteristicvaluechanged', (event) => {
                const heartRate = this.parseHeartRateValue(event.target.value);
                this.recordBiometricData('heartRate', {
                    timestamp: new Date().toISOString(),
                    bpm: heartRate,
                    deviceId: device.id
                });
            });

            this.connectedDevices.heartRateMonitor = {
                id: device.id,
                name: device.name,
                connected: true,
                lastSync: new Date().toISOString()
            };

            this.saveConnectedDevices();
            return true;

        } catch (error) {
            ErrorHandler.handle(error, 'Heart Rate Monitor Connection');
            return false;
        }
    }

    /**
     * Parse heart rate value from Bluetooth characteristic
     */
    parseHeartRateValue(value) {
        const flags = value.getUint8(0);
        const is16Bit = flags & 0x01;
        
        if (is16Bit) {
            return value.getUint16(1, true);
        } else {
            return value.getUint8(1);
        }
    }

    /**
     * Record biometric data point
     */
    recordBiometricData(type, data) {
        if (!this.biometricData[type]) {
            this.biometricData[type] = [];
        }

        // Add data point
        this.biometricData[type].push(data);

        // Keep only last 1000 entries per type to manage storage
        if (this.biometricData[type].length > 1000) {
            this.biometricData[type] = this.biometricData[type].slice(-1000);
        }

        this.saveBiometricData();
        
        // Trigger real-time analysis if needed
        this.triggerRealtimeAnalysis(type, data);
    }

    /**
     * Manually log biometric data
     */
    logManualBiometric(type, value, notes = '') {
        const data = {
            timestamp: new Date().toISOString(),
            value: parseFloat(value),
            notes,
            source: 'manual'
        };

        this.recordBiometricData(type, data);
        return data;
    }

    /**
     * Get biometric data for analysis
     */
    getBiometricData(type = null, startDate = null, endDate = null) {
        if (type) {
            let data = this.biometricData[type] || [];
            
            if (startDate || endDate) {
                data = data.filter(entry => {
                    const entryDate = new Date(entry.timestamp);
                    return (!startDate || entryDate >= startDate) && 
                           (!endDate || entryDate <= endDate);
                });
            }
            
            return data;
        }

        return this.biometricData;
    }

    /**
     * Get current biometric summary
     */
    getCurrentBiometricSummary() {
        const summary = {};
        const now = new Date();
        const last24Hours = new Date(now.getTime() - 24 * 60 * 60 * 1000);

        Object.keys(this.biometricData).forEach(type => {
            const recentData = this.getBiometricData(type, last24Hours);
            
            if (recentData.length > 0) {
                const values = recentData.map(entry => entry.value || entry.bpm || entry.steps || entry.magnitude).filter(v => v);
                
                if (values.length > 0) {
                    summary[type] = {
                        count: values.length,
                        latest: values[values.length - 1],
                        average: values.reduce((a, b) => a + b, 0) / values.length,
                        min: Math.min(...values),
                        max: Math.max(...values),
                        lastUpdate: recentData[recentData.length - 1].timestamp
                    };
                }
            }
        });

        return summary;
    }

    /**
     * Calculate health metrics correlations
     */
    calculateHealthCorrelations(goals) {
        const correlations = {};
        const biometricSummary = this.getCurrentBiometricSummary();

        // Analyze correlations between biometric data and goal performance
        goals.forEach(goal => {
            const goalCorrelations = {};
            
            Object.keys(biometricSummary).forEach(biometricType => {
                const correlation = this.calculateBiometricGoalCorrelation(goal, biometricType);
                if (correlation !== null) {
                    goalCorrelations[biometricType] = correlation;
                }
            });

            if (Object.keys(goalCorrelations).length > 0) {
                correlations[goal.name] = goalCorrelations;
            }
        });

        return correlations;
    }

    /**
     * Calculate correlation between biometric data and goal performance
     */
    calculateBiometricGoalCorrelation(goal, biometricType) {
        try {
            // Get goal progress data by day
            const goalData = this.getGoalProgressByDay(goal);
            
            // Get biometric data by day
            const biometricData = this.getBiometricDataByDay(biometricType);

            // Find common dates
            const commonDates = Object.keys(goalData).filter(date => 
                biometricData.hasOwnProperty(date)
            );

            if (commonDates.length < 5) return null; // Need at least 5 data points

            // Prepare data for correlation analysis
            const x = commonDates.map(date => biometricData[date]);
            const y = commonDates.map(date => goalData[date]);

            // Calculate Pearson correlation coefficient
            return StatisticalAnalysis.correlation(x, y);

        } catch (error) {
            ErrorHandler.handle(error, 'Correlation Calculation');
            return null;
        }
    }

    /**
     * Get goal progress organized by day
     */
    getGoalProgressByDay(goal) {
        const progressByDay = {};
        
        goal.history.forEach(entry => {
            const date = new Date(entry.fullDate).toDateString();
            if (!progressByDay[date]) {
                progressByDay[date] = 0;
            }
            progressByDay[date] += entry.amount;
        });

        return progressByDay;
    }

    /**
     * Get biometric data organized by day
     */
    getBiometricDataByDay(biometricType) {
        const dataByDay = {};
        const data = this.biometricData[biometricType] || [];

        data.forEach(entry => {
            const date = new Date(entry.timestamp).toDateString();
            const value = entry.value || entry.bpm || entry.steps || entry.magnitude;
            
            if (value) {
                if (!dataByDay[date]) {
                    dataByDay[date] = [];
                }
                dataByDay[date].push(value);
            }
        });

        // Calculate daily averages
        Object.keys(dataByDay).forEach(date => {
            const values = dataByDay[date];
            dataByDay[date] = values.reduce((a, b) => a + b, 0) / values.length;
        });

        return dataByDay;
    }

    /**
     * Generate health insights from biometric data
     */
    generateHealthInsights(goals) {
        const insights = [];
        const summary = this.getCurrentBiometricSummary();
        const correlations = this.calculateHealthCorrelations(goals);

        // Heart rate insights
        if (summary.heartRate) {
            insights.push(...this.generateHeartRateInsights(summary.heartRate));
        }

        // Activity insights
        if (summary.steps) {
            insights.push(...this.generateActivityInsights(summary.steps));
        }

        // Correlation insights
        Object.keys(correlations).forEach(goalName => {
            insights.push(...this.generateCorrelationInsights(goalName, correlations[goalName]));
        });

        // Sleep insights (if available)
        if (summary.sleep) {
            insights.push(...this.generateSleepInsights(summary.sleep));
        }

        return insights.sort((a, b) => (b.priority || 1) - (a.priority || 1));
    }

    /**
     * Generate heart rate specific insights
     */
    generateHeartRateInsights(heartRateData) {
        const insights = [];
        const avgHR = heartRateData.average;
        const restingHRThreshold = 100;

        if (avgHR > restingHRThreshold) {
            insights.push({
                type: 'warning',
                category: 'heart_rate',
                title: 'Elevated Heart Rate',
                message: `Your average heart rate (${Math.round(avgHR)} bpm) is elevated. Consider consulting a healthcare provider.`,
                priority: 3,
                icon: '❤️'
            });
        } else if (avgHR < 50) {
            insights.push({
                type: 'info',
                category: 'heart_rate',
                title: 'Low Heart Rate',
                message: `Your heart rate (${Math.round(avgHR)} bpm) is quite low. This might indicate good fitness or require medical attention.`,
                priority: 2,
                icon: '❤️'
            });
        }

        return insights;
    }

    /**
     * Generate activity specific insights
     */
    generateActivityInsights(stepsData) {
        const insights = [];
        const dailySteps = stepsData.latest;

        if (dailySteps < 5000) {
            insights.push({
                type: 'suggestion',
                category: 'activity',
                title: 'Low Daily Activity',
                message: `You've taken ${dailySteps} steps today. Try to reach 10,000 steps for better health.`,
                priority: 2,
                icon: '🚶'
            });
        } else if (dailySteps >= 10000) {
            insights.push({
                type: 'positive',
                category: 'activity',
                title: 'Great Activity Level',
                message: `Excellent! You've taken ${dailySteps} steps today, meeting the daily recommendation.`,
                priority: 1,
                icon: '🎉'
            });
        }

        return insights;
    }

    /**
     * Generate correlation insights
     */
    generateCorrelationInsights(goalName, correlations) {
        const insights = [];

        Object.keys(correlations).forEach(biometricType => {
            const correlation = correlations[biometricType];
            
            if (Math.abs(correlation) > 0.5) {
                const direction = correlation > 0 ? 'positively' : 'negatively';
                const strength = Math.abs(correlation) > 0.7 ? 'strongly' : 'moderately';
                
                insights.push({
                    type: 'info',
                    category: 'correlation',
                    title: `${goalName} - ${biometricType} Connection`,
                    message: `Your ${goalName} progress is ${strength} ${direction} correlated with ${biometricType} (${correlation.toFixed(2)}).`,
                    priority: 1,
                    icon: '🔗'
                });
            }
        });

        return insights;
    }

    /**
     * Trigger real-time analysis for immediate insights
     */
    triggerRealtimeAnalysis(type, data) {
        // Check for anomalies or patterns that need immediate attention
        if (type === 'heartRate' && data.bpm) {
            if (data.bpm > 150 || data.bpm < 40) {
                // Trigger alert for extreme heart rate
                this.triggerHealthAlert(type, data);
            }
        }

        // Trigger updates to UI components that show real-time biometric data
        if (typeof window !== 'undefined' && window.BiometricUI) {
            window.BiometricUI.updateRealtimeDisplay(type, data);
        }
    }

    /**
     * Trigger health alert for concerning biometric readings
     */
    triggerHealthAlert(type, data) {
        const alert = {
            type: 'health_alert',
            biometricType: type,
            value: data.value || data.bpm,
            timestamp: data.timestamp,
            message: this.getHealthAlertMessage(type, data)
        };

        // Store alert
        if (!this.biometricData.alerts) {
            this.biometricData.alerts = [];
        }
        this.biometricData.alerts.push(alert);

        // Show notification if available
        if (typeof window !== 'undefined' && window.NotificationManager) {
            window.NotificationManager.showHealthAlert(alert);
        }
    }

    /**
     * Get appropriate health alert message
     */
    getHealthAlertMessage(type, data) {
        switch (type) {
            case 'heartRate':
                if (data.bpm > 150) {
                    return `High heart rate detected: ${data.bpm} bpm. Consider taking a break.`;
                } else if (data.bpm < 40) {
                    return `Very low heart rate detected: ${data.bpm} bpm. Consider consulting a healthcare provider.`;
                }
                break;
            default:
                return `Unusual ${type} reading detected.`;
        }
    }

    /**
     * Set up periodic sync for connected devices
     */
    setupPeriodicSync() {
        // Sync every 5 minutes
        setInterval(() => {
            this.syncConnectedDevices();
        }, 5 * 60 * 1000);
    }

    /**
     * Sync data from connected devices
     */
    async syncConnectedDevices() {
        try {
            for (const [deviceType, device] of Object.entries(this.connectedDevices)) {
                if (device.connected) {
                    await this.syncDevice(deviceType, device);
                }
            }
            
            this.lastSync = new Date().toISOString();
            localStorage.setItem('lastBiometricSync', this.lastSync);
            
        } catch (error) {
            ErrorHandler.handle(error, 'Device Sync');
        }
    }

    /**
     * Sync individual device
     */
    async syncDevice(deviceType, device) {
        // This would implement actual device sync logic
        // For now, we'll simulate sync
        console.log(`Syncing ${deviceType} device:`, device.name);
    }

    /**
     * Save biometric data to storage
     */
    saveBiometricData() {
        localStorage.setItem('biometricData', JSON.stringify(this.biometricData));
    }

    /**
     * Save connected devices to storage
     */
    saveConnectedDevices() {
        localStorage.setItem('connectedDevices', JSON.stringify(this.connectedDevices));
    }

    /**
     * Get basic capabilities for fallback
     */
    getBasicCapabilities() {
        return {
            heartRate: false,
            sensors: false,
            geolocation: false,
            camera: false,
            microphone: false,
            webBluetooth: false,
            webUSB: false,
            manual: true
        };
    }

    /**
     * Export biometric data
     */
    exportBiometricData() {
        const exportData = {
            biometricData: this.biometricData,
            connectedDevices: this.connectedDevices,
            lastSync: this.lastSync,
            exportDate: new Date().toISOString(),
            version: '1.0'
        };

        return JSON.stringify(exportData, null, 2);
    }

    /**
     * Import biometric data
     */
    importBiometricData(jsonData) {
        try {
            const data = JSON.parse(jsonData);
            
            // Validate data structure
            if (!data.biometricData) {
                throw new Error('Invalid biometric data format');
            }

            // Merge with existing data
            Object.keys(data.biometricData).forEach(type => {
                if (!this.biometricData[type]) {
                    this.biometricData[type] = [];
                }
                this.biometricData[type].push(...data.biometricData[type]);
                
                // Remove duplicates based on timestamp
                this.biometricData[type] = this.removeDuplicatesByTimestamp(this.biometricData[type]);
            });

            this.saveBiometricData();
            return true;

        } catch (error) {
            ErrorHandler.handle(error, 'Biometric Data Import');
            return false;
        }
    }

    /**
     * Remove duplicate entries by timestamp
     */
    removeDuplicatesByTimestamp(data) {
        const seen = new Set();
        return data.filter(entry => {
            if (seen.has(entry.timestamp)) {
                return false;
            }
            seen.add(entry.timestamp);
            return true;
        });
    }

    /**
     * Get health trends over time
     */
    getHealthTrends(type, days = 30) {
        const data = this.getBiometricData(type, new Date(Date.now() - days * 24 * 60 * 60 * 1000));
        
        if (data.length === 0) return null;

        // Group by day and calculate daily averages
        const dailyData = {};
        data.forEach(entry => {
            const date = new Date(entry.timestamp).toDateString();
            const value = entry.value || entry.bpm || entry.steps || entry.magnitude;
            
            if (value) {
                if (!dailyData[date]) {
                    dailyData[date] = [];
                }
                dailyData[date].push(value);
            }
        });

        // Calculate trends
        const trendData = Object.keys(dailyData)
            .sort((a, b) => new Date(a) - new Date(b))
            .map((date, index) => {
                const values = dailyData[date];
                const average = values.reduce((a, b) => a + b, 0) / values.length;
                
                return {
                    x: index,
                    y: average,
                    date,
                    count: values.length
                };
            });

        // Calculate linear regression for trend
        const trend = StatisticalAnalysis.linearRegression(trendData);

        return {
            data: trendData,
            trend,
            summary: StatisticalAnalysis.statisticalSummary(trendData.map(d => d.y))
        };
    }
}

// Export for use in main application
if (typeof window !== 'undefined') {
    window.BiometricTracking = {
        BiometricDataManager
    };
}

// Global instance
let biometricManager = null;

// Initialize when DOM is ready
if (typeof document !== 'undefined') {
    document.addEventListener('DOMContentLoaded', async () => {
        biometricManager = new BiometricDataManager();
        await biometricManager.initialize();
        
        // Make available globally
        window.biometricManager = biometricManager;
    });
}
# System Monitor Agent

A lightweight Node.js agent that collects system metrics (CPU, RAM, disk, network) from your server and sends them to a monitoring dashboard.

**Main Dashboard Repository:** [simple-server-monitor](https://github.com/SathiraSriSathsara/simple-server-monitor)

## Features

- 📊 Real-time system monitoring
- 💻 CPU usage tracking
- 🧠 Memory (RAM) monitoring
- 💾 Disk usage statistics
- 🌐 Network throughput monitoring (RX/TX rates)
- 🔒 Secure data transmission with authentication
- ⚡ Configurable polling interval
- 🚀 Easy setup with automated installation script

## Requirements

- Node.js (LTS version recommended)
- npm
- A running instance of the [simple-server-monitor dashboard](https://github.com/SathiraSriSathsara/simple-server-monitor)

## Installation

### Quick Setup (Recommended)

1. Clone the repository:
   ```bash
   git clone <repository-url>
   cd sys-monitor-agent
   ```

2. Run the setup script:
   ```bash
   chmod +x setup.sh
   ./setup.sh
   ```

   The setup script will:
   - Verify Node.js and npm are installed
   - Prompt you for configuration values
   - Create a `.env` file with your settings
   - Install dependencies
   - Start the agent

### Manual Setup

1. Clone the repository:
   ```bash
   git clone <repository-url>
   cd sys-monitor-agent
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Create a `.env` file:
   ```bash
   cp .env.example .env
   ```

4. Edit `.env` with your configuration (see Configuration section below)

5. Start the agent:
   ```bash
   node agent.js
   ```

## Configuration

Create a `.env` file in the project root with the following variables:

```env
DASHBOARD_URL=http://YOUR_DASHBOARD_IP:5050/api/ingest
INGEST_SECRET=your_secret_key_here
SERVER_ID=server-1
INTERVAL_MS=5000
```

### Configuration Options

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `DASHBOARD_URL` | Yes | - | URL of the dashboard's ingest API endpoint |
| `INGEST_SECRET` | Yes | - | Secret key for authenticating with the dashboard |
| `SERVER_ID` | No | `server-1` | Unique identifier for this server |
| `INTERVAL_MS` | No | `2000` | Data collection interval in milliseconds (recommended: 5000+) |

## Usage

### Starting the Agent

```bash
node agent.js
```

### Running as a Service

For production environments, it's recommended to run the agent as a systemd service:

1. Create a systemd service file:
   ```bash
   sudo nano /etc/systemd/system/sys-monitor-agent.service
   ```

2. Add the following content:
   ```ini
   [Unit]
   Description=System Monitor Agent
   After=network.target

   [Service]
   Type=simple
   User=your_user
   WorkingDirectory=/path/to/sys-monitor-agent
   ExecStart=/usr/bin/node agent.js
   Restart=always
   RestartSec=10

   [Install]
   WantedBy=multi-user.target
   ```

3. Enable and start the service:
   ```bash
   sudo systemctl daemon-reload
   sudo systemctl enable sys-monitor-agent
   sudo systemctl start sys-monitor-agent
   ```

4. Check service status:
   ```bash
   sudo systemctl status sys-monitor-agent
   ```

### Using PM2 (Alternative)

```bash
npm install -g pm2
pm2 start agent.js --name sys-monitor-agent
pm2 save
pm2 startup
```

## How It Works

1. **System Information Collection**: The agent uses the `systeminformation` library to gather metrics:
   - CPU load percentage
   - Memory usage (used/total)
   - Disk usage percentage
   - Network transfer rates (bytes/sec)

2. **Static Server Info**: On startup, the agent caches static information (hostname, OS, CPU model, total RAM/disk)

3. **Data Transmission**: Every `INTERVAL_MS` milliseconds, the agent:
   - Collects current metrics
   - Formats them into a JSON payload
   - Sends data to the dashboard via HTTP POST
   - Uses Bearer token authentication

4. **Network Rate Calculation**: Network RX/TX rates are calculated by comparing current bytes transferred with the previous reading

## Monitored Metrics

- **CPU Usage**: Current CPU load percentage
- **RAM Usage**: Memory utilization percentage
- **Disk Usage**: Root filesystem usage percentage
- **Network RX**: Download throughput (bytes/second)
- **Network TX**: Upload throughput (bytes/second)
- **Server Info**: Hostname, OS, CPU model, cores, total RAM, total disk

## Troubleshooting

### Agent won't start

- Verify Node.js is installed: `node --version`
- Check `.env` file exists and contains required variables
- Ensure `DASHBOARD_URL` is accessible from the server

### No data appearing on dashboard

- Verify `INGEST_SECRET` matches the dashboard configuration
- Check network connectivity to the dashboard
- Review agent logs for error messages
- Ensure `SERVER_ID` is unique if monitoring multiple servers

### High CPU usage

- Increase `INTERVAL_MS` to reduce polling frequency
- Default of 5000ms (5 seconds) is recommended for most use cases

## Dependencies

- [axios](https://www.npmjs.com/package/axios) - HTTP client for sending data
- [dotenv](https://www.npmjs.com/package/dotenv) - Environment variable management
- [systeminformation](https://www.npmjs.com/package/systeminformation) - System metrics collection

## License

ISC

## Contributing

This agent is designed to work with the [simple-server-monitor](https://github.com/SathiraSriSathsara/simple-server-monitor) dashboard. Please refer to the main repository for contribution guidelines.

## Support

For issues and questions, please open an issue on the [main repository](https://github.com/SathiraSriSathsara/simple-server-monitor/issues).
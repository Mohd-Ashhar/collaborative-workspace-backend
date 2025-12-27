const { JOB_STATUS } = require("../config/jobs.config");
const JobDBService = require("../services/job-db.service");

class DataExportWorker {
  // Process data export job
  static async process(job) {
    const { jobId, projectId, exportType, format, userId } = job.data;

    try {
      console.log(`🔄 Exporting data: ${jobId} - ${exportType} as ${format}`);

      await JobDBService.updateJobStatus(jobId, JOB_STATUS.PROCESSING);

      job.progress(10);

      // Fetch data
      const data = await this.fetchData(projectId, exportType, job);

      job.progress(40);

      // Format data
      const formattedData = await this.formatData(data, format, job);

      job.progress(70);

      // Generate download URL (simulated)
      const downloadUrl = await this.generateDownloadUrl(
        formattedData,
        format,
        job
      );

      job.progress(90);

      const result = {
        exportType,
        format,
        downloadUrl,
        recordCount: data.length,
        fileSize: formattedData.length,
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // 24 hours
        generatedAt: new Date().toISOString(),
      };

      await JobDBService.updateJobStatus(jobId, JOB_STATUS.COMPLETED, {
        result,
      });

      job.progress(100);

      console.log(`✅ Data export completed: ${jobId}`);

      return result;
    } catch (error) {
      console.error(`❌ Data export failed: ${jobId}`, error);

      await JobDBService.updateJobStatus(jobId, JOB_STATUS.FAILED, {
        errorMessage: error.message,
        retryCount: job.attemptsMade,
      });

      throw error;
    }
  }

  // Fetch data from database
  static async fetchData(projectId, exportType, job) {
    // Simulate database query delay
    await new Promise((resolve) => setTimeout(resolve, 1500));

    // Simulated data
    const recordCount = Math.floor(Math.random() * 500) + 100;
    const data = Array.from({ length: recordCount }, (_, i) => ({
      id: i + 1,
      projectId,
      type: exportType,
      timestamp: new Date().toISOString(),
      data: `Record ${i + 1}`,
    }));

    return data;
  }

  // Format data according to format
  static async formatData(data, format, job) {
    await new Promise((resolve) => setTimeout(resolve, 1000));

    let formatted;

    switch (format) {
      case "json":
        formatted = JSON.stringify(data, null, 2);
        break;
      case "csv":
        formatted = this.convertToCSV(data);
        break;
      case "xml":
        formatted = this.convertToXML(data);
        break;
      default:
        formatted = JSON.stringify(data);
    }

    return formatted;
  }

  // Convert to CSV
  static convertToCSV(data) {
    if (data.length === 0) return "";

    const headers = Object.keys(data[0]);
    const csvRows = [headers.join(",")];

    for (const row of data) {
      const values = headers.map((header) => {
        const value = row[header];
        return typeof value === "string" ? `"${value}"` : value;
      });
      csvRows.push(values.join(","));
    }

    return csvRows.join("\n");
  }

  // Convert to XML
  static convertToXML(data) {
    let xml = '<?xml version="1.0" encoding="UTF-8"?>\n<data>\n';

    for (const item of data) {
      xml += "  <record>\n";
      for (const [key, value] of Object.entries(item)) {
        xml += `    <${key}>${value}</${key}>\n`;
      }
      xml += "  </record>\n";
    }

    xml += "</data>";
    return xml;
  }

  // Generate download URL
  static async generateDownloadUrl(data, format, job) {
    await new Promise((resolve) => setTimeout(resolve, 500));

    // In production, upload to S3/cloud storage and return signed URL
    const filename = `export_${Date.now()}.${format}`;
    const simulatedUrl = `https://storage.example.com/exports/${filename}`;

    return simulatedUrl;
  }
}

module.exports = DataExportWorker;

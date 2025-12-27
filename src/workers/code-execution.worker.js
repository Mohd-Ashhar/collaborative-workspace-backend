const { JOB_STATUS } = require("../config/jobs.config");
const JobDBService = require("../services/job-db.service");

class CodeExecutionWorker {
  // Process code execution job
  static async process(job) {
    const { jobId, code, language, userId, projectId } = job.data;

    try {
      console.log(`🔄 Processing code execution job: ${jobId}`);

      // Update job status to processing
      await JobDBService.updateJobStatus(jobId, JOB_STATUS.PROCESSING);

      // Update progress
      job.progress(10);

      // Simulate code execution (in production, this would use Docker/sandbox)
      await this.executeCode(code, language, job);

      job.progress(50);

      // Simulate getting results
      const result = await this.getExecutionResult(code, language);

      job.progress(90);

      // Update job status to completed
      await JobDBService.updateJobStatus(jobId, JOB_STATUS.COMPLETED, {
        result: {
          output: result.output,
          executionTime: result.executionTime,
          memoryUsed: result.memoryUsed,
          exitCode: result.exitCode,
        },
      });

      job.progress(100);

      console.log(`✅ Code execution completed: ${jobId}`);

      return result;
    } catch (error) {
      console.error(`❌ Code execution failed: ${jobId}`, error);

      // Update job status to failed
      await JobDBService.updateJobStatus(jobId, JOB_STATUS.FAILED, {
        errorMessage: error.message,
        retryCount: job.attemptsMade,
      });

      throw error;
    }
  }

  // Simulate code execution
  static async executeCode(code, language, job) {
    // Simulated execution delay (1-3 seconds)
    const delay = Math.random() * 2000 + 1000;

    return new Promise((resolve, reject) => {
      setTimeout(() => {
        // Simulate random failures (10% chance)
        if (Math.random() < 0.1) {
          reject(new Error("Execution timeout or runtime error"));
        } else {
          resolve();
        }
      }, delay);
    });
  }

  // Get execution result
  static async getExecutionResult(code, language) {
    // Simulated result based on code
    const output = this.simulateOutput(code, language);

    return {
      output,
      executionTime: Math.floor(Math.random() * 1000) + 100, // ms
      memoryUsed: Math.floor(Math.random() * 50) + 10, // MB
      exitCode: 0,
      language,
    };
  }

  // Simulate output
  static simulateOutput(code, language) {
    const outputs = {
      javascript: `> Executing JavaScript...\n${code}\n> Execution completed successfully`,
      python: `>>> Executing Python...\n${code}\n>>> Done`,
      java: `Compiling Java...\nExecuting...\n${code}\nExecution completed`,
      cpp: `Compiling C++...\nLinking...\nExecuting...\n${code}\nProcess finished`,
    };

    return outputs[language] || `Executing ${language}...\n${code}\nCompleted`;
  }
}

module.exports = CodeExecutionWorker;

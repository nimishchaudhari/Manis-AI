import amqplib from 'amqplib';
import { Logger } from './logging.js';

export interface RabbitMQConfig {
  url: string;
}

export class RabbitMQClient {
  private connection: any | null = null;
  private channel: any | null = null;
  private readonly config: RabbitMQConfig;
  private readonly logger: Logger;

  constructor(config: RabbitMQConfig, logger: Logger) {
    this.config = config;
    this.logger = logger;
  }

  async connect(): Promise<void> {
    try {
      this.connection = await amqplib.connect(this.config.url);
      this.channel = await this.connection.createChannel();
      this.logger.info('Connected to RabbitMQ');

      this.connection.on('close', () => {
        this.logger.warn('RabbitMQ connection closed');
        this.connection = null;
        this.channel = null; // Also clear the channel
      });

      this.channel?.on('error', (err: any) => {
          this.logger.error('RabbitMQ channel error', err);
          this.channel = null;
      });
    } catch (err) {
      this.logger.error('Failed to connect to RabbitMQ', err);
      throw err;
    }
  }

  getChannel(): any {
    if (!this.channel) {
      throw new Error('RabbitMQ channel is not initialized. Call connect() first.');
    }
    return this.channel;
  }

  async declareExchangesAndQueues(): Promise<void> {
    try {
      const channel = this.getChannel();

      // Declare exchanges
      await channel.assertExchange('tasks', 'topic', { durable: true });
      await channel.assertExchange('status', 'topic', { durable: true });
      await channel.assertExchange('logs', 'topic', { durable: true });
      await channel.assertExchange('capabilities', 'topic', { durable: true });

      // Declare queues
      await channel.assertQueue('agent.websearch.tasks', { durable: true });
      await channel.assertQueue('orchestrator.status', { durable: true });

      // Bind queues to exchanges
      await channel.bindQueue('agent.websearch.tasks', 'tasks', 'websearch.*'); // Example routing key
      await channel.bindQueue('orchestrator.status', 'status', 'orchestrator.*');

      this.logger.info('Exchanges and queues declared successfully');
    } catch (err: any) {
      this.logger.error('Failed to declare exchanges and queues', err);
      throw err;
    }
  }

  async close(): Promise<void> {
    try {
      if (this.channel) {
        await this.channel.close();
        this.logger.info('RabbitMQ channel closed');
      }
      if (this.connection) {
        await this.connection.close();
        this.logger.info('RabbitMQ connection closed');
      }
    } catch (err) {
      this.logger.error('Error closing RabbitMQ connection', err);
    } finally {
      this.channel = null;
      this.connection = null;
    }
  }
}
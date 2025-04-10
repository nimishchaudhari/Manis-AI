import { TaskAssignment } from '@acme/shared-mcp';
import { RabbitMQConfig } from '@acme/shared-utils';
import { AgentService } from '@acme/agent-template';

interface EchoAgentConfig {
    rabbitmq: RabbitMQConfig;
    agentId: string;
    taskQueue: string;
}
declare class EchoAgent extends AgentService {
    constructor(config: EchoAgentConfig);
    handleTask(task: TaskAssignment): Promise<void>;
    executeTask(task: TaskAssignment): Promise<unknown>;
}

export { EchoAgent };

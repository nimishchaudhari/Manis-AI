import { TaskAssignment } from '@acme/shared-mcp';
import { AgentService, AgentConfig } from '@acme/agent-template';
interface EchoAgentConfig extends AgentConfig {
    agentId: string;
    taskQueue: string;
}
export declare class EchoAgent extends AgentService {
    constructor(config: EchoAgentConfig);
    executeTask(task: TaskAssignment): Promise<unknown>;
}
export default EchoAgent;
//# sourceMappingURL=index.d.ts.map
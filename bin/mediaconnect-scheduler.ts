#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import { MediaconnectSchedulerStack } from '../lib/mediaconnect-scheduler-stack';
import * as fs from 'fs';
import * as path from 'path';

// Define interfaces for our configuration
interface FlowConfig {
  FlowArn: string;
  StartFlowSchedules: string[];
  StopFlowSchedules: string[];
}

interface Config {
  Schedules: FlowConfig[];
}

const app = new cdk.App();

// Read the config file
const configPath = path.join(__dirname, '..', 'config', 'config.json');
let config: Config;
try {
  const configFile = fs.readFileSync(configPath, 'utf8');
  config = JSON.parse(configFile) as Config;
} catch (error) {
  throw new Error(`Error reading or parsing config file: ${error}`);
}

const flowConfigs = config.Schedules.filter(flow => flow.FlowArn);

if (flowConfigs.length === 0) {
  throw new Error('No valid MediaConnect Flow configuration found in the config file');
}




// Create a stack for each flow
flowConfigs.forEach((flowConfig: FlowConfig, index: number) => {
  const flowName = flowConfig.FlowArn.split(':').pop() || 'UnknownFlow';
  const stackName = `${app.node.tryGetContext('stackName') || 'MediaconnectSchedulerStack'}-${flowName}`;

  // Ensure the stack name is valid
  const fullStackName = `${stackName}`.replace(/[^A-Za-z0-9-]/g, '').slice(0, 128);

  new MediaconnectSchedulerStack(app, fullStackName, {
    stackName: fullStackName,
    mediaConnectFlowArn: flowConfig.FlowArn,
    flowName,
    startFlowSchedules: flowConfig.StartFlowSchedules,
    stopFlowSchedules: flowConfig.StopFlowSchedules,
    flowIndex: index + 1,
    env: {
      account: process.env.CDK_DEFAULT_ACCOUNT!,
      region: process.env.CDK_DEFAULT_REGION!,
    },
  });
});

// Synthesize the app
app.synth();



// const flowArns = flowConfigs.map(flow => flow.FlowArn);

// flowArns.forEach(flowArn => {
//   const flowName = flowArn.split(':').pop() || 'UnknownFlow';
//   const stackName = `${app.node.tryGetContext('stackName') || 'MediaconnectSchedulerStack'}-${flowName}`;

//   const fullStackName = `${stackName}`.replace(/[^A-Za-z0-9-]/g, '').slice(0, 128);


//   new MediaconnectSchedulerStack(app, stackName, {
//     stackName: fullStackName,
//     mediaConnectFlowArn: flowArn,
//     flowName,
//     env: {
//       account: process.env.CDK_DEFAULT_ACCOUNT!,
//       region: process.env.CDK_DEFAULT_REGION!,
//     },
//   });
// });

//------------

// // Get the first non-empty FlowArn from the config
// const flowConfig = config.Flows.find((flow: FlowConfig) => flow.FlowArn);

// if (!flowConfig || !flowConfig.FlowArn) {
//   throw new Error('No valid MediaConnect Flow configuration found in the config file');
// }

// const mediaConnectFlowArn = flowConfig.FlowArn;
// const flowName = mediaConnectFlowArn.split(':').pop() || 'UnknownFlow';

// const stackName = app.node.tryGetContext('stackName') || 'MediaconnectSchedulerStack';

// const fullStackName = `${stackName}-${flowName}`.replace(/[^A-Za-z0-9-]/g, '').slice(0, 128);

// const description = app.node.tryGetContext('stackDescription') || 'MediaconnectSchedulerStack Description';

// new MediaconnectSchedulerStack(app, 'MediaconnectSchedulerStack', {
//   stackName: fullStackName,
//   description: description,
//   mediaConnectFlowArn: mediaConnectFlowArn,
//   flowName: flowName,
//   startFlowSchedule: flowConfig.StartFlowSchedule,
//   stopFlowSchedule: flowConfig.StopFlowSchedule,
//   env: {
//     account: process.env.CDK_DEFAULT_ACCOUNT!,
//     region: process.env.CDK_DEFAULT_REGION!,
//   },
// });
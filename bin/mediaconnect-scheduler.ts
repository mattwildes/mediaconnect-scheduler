#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import { MediaconnectSchedulerStack } from '../lib/mediaconnect-scheduler-stack';

const app = new cdk.App();

// Get the MediaConnect Flow ARN from context or environment variable
const mediaConnectFlowArn = app.node.tryGetContext('mediaConnectFlowArn') || process.env.MEDIA_CONNECT_FLOW_ARN;

if (!mediaConnectFlowArn) {
  throw new Error('MediaConnect Flow ARN must be provided via CDK context or MEDIA_CONNECT_FLOW_ARN environment variable');
}
const flowName = mediaConnectFlowArn.split(':').pop() || 'UnknownFlow';

const stackName = app.node.tryGetContext('stackName') || 'MediaconnectSchedulerStack';

const fullStackName = `${stackName}-${flowName}`.replace(/[^A-Za-z0-9-]/g, '').slice(0, 128);

const description = app.node.tryGetContext('stackDescription') || 'MediaconnectSchedulerStack Description';

new MediaconnectSchedulerStack(app, 'MediaconnectSchedulerStack', {
  stackName: fullStackName,
  description: description,
  mediaConnectFlowArn: mediaConnectFlowArn.valueAsString,
  flowName: flowName,
  env: {
    account: process.env.CDK_DEFAULT_ACCOUNT!,
    region: process.env.CDK_DEFAULT_REGION!,
  },
});
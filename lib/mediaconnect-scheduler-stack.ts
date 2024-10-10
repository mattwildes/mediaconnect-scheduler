import * as cdk from 'aws-cdk-lib';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as events from 'aws-cdk-lib/aws-events';
import * as targets from 'aws-cdk-lib/aws-events-targets';
import * as iam from 'aws-cdk-lib/aws-iam';
import { Construct } from 'constructs';


interface MediaconnectSchedulerStackProps extends cdk.StackProps {
  stackName: string;
  mediaConnectFlowArn: string;
  flowName: string;
  startFlowSchedules: string[];
  stopFlowSchedules: string[];
  flowIndex: number;
}


export class MediaconnectSchedulerStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props: MediaconnectSchedulerStackProps) {
    super(scope, id, props);

    const mediaConnectPolicyDocument = iam.PolicyDocument.fromJson({
      Version: '2012-10-17',
      Statement: [
        {
          Effect: 'Allow',
          Action: [
            'mediaconnect:StartFlow',
            'mediaconnect:DescribeFlow',
            'mediaconnect:StopFlow',
          ],
          Resource: '*',
        },
      ],
    });


    const lambdaExecutionRole = new iam.Role(this, `${props.stackName}-LambdaExecutionRole`, {
      assumedBy: new iam.ServicePrincipal('lambda.amazonaws.com'),
      managedPolicies: [
        iam.ManagedPolicy.fromAwsManagedPolicyName(
          'service-role/AWSLambdaBasicExecutionRole'
        ),
      ],
      inlinePolicies: {
        mediaConnectPolicy: mediaConnectPolicyDocument,
      },
    });


    const lambdaFunctionStartFlow = new lambda.Function(this, `${props.stackName}-LambdaFunction-StartFlow`, {
      functionName: `${props.stackName}-StartFlow`,
      runtime: lambda.Runtime.PYTHON_3_12,
      handler: 'index.lambda_handler',
      code: lambda.Code.fromAsset(__dirname + '/lambda/start_flow'),
      timeout: cdk.Duration.minutes(2.5),
      environment: {
        MEDIACONNECT_FLOW_ARN: props.mediaConnectFlowArn,
      },
      role: lambdaExecutionRole
    });

    const lambdaFunctionStopFlow = new lambda.Function(this, `${props.stackName}-LambdaFunction-StopFlow`, {
      functionName: `${props.stackName}-StopFlow`,
      runtime: lambda.Runtime.PYTHON_3_12,
      handler: 'index.lambda_handler',
      code: lambda.Code.fromAsset(__dirname + '/lambda/stop_flow'),
      timeout: cdk.Duration.minutes(2.5),
      environment: {
        MEDIACONNECT_FLOW_ARN: props.mediaConnectFlowArn,
      },
      role: lambdaExecutionRole
    });


    const startFlowRules: events.Rule[] = [];
    const stopFlowRules: events.Rule[] = [];

    // Create EventBridge rules for starting the flow
    props.startFlowSchedules.forEach((schedule, index) => {
      const startFlowSchedule = events.Schedule.expression(`cron(${schedule})`);
      const startFlowRule = new events.Rule(this, `${props.stackName}-ScheduledEvent-StartFlow-${index + 1}`, {
        ruleName: `${props.stackName}-StartFlow-${index + 1}`,
        schedule: startFlowSchedule,
        targets: [new targets.LambdaFunction(lambdaFunctionStartFlow, {
          event: events.RuleTargetInput.fromObject({ action: 'START', flowArn: props.mediaConnectFlowArn })
        })],
      });
      startFlowRules.push(startFlowRule);
    });

    // Create EventBridge rules for stopping the flow
    props.stopFlowSchedules.forEach((schedule, index) => {
      const stopFlowSchedule = events.Schedule.expression(`cron(${schedule})`);
      const stopFlowRule = new events.Rule(this, `${props.stackName}-ScheduledEvent-StopFlow-${index + 1}`, {
        ruleName: `${props.stackName}-StopFlow-${index + 1}`,
        schedule: stopFlowSchedule,
        targets: [new targets.LambdaFunction(lambdaFunctionStopFlow, {
          event: events.RuleTargetInput.fromObject({ action: 'STOP', flowArn: props.mediaConnectFlowArn })
        })],
      });
      stopFlowRules.push(stopFlowRule);
    });

    new cdk.CfnOutput(this, 'LambdaFunctionName', {
      value: lambdaFunctionStartFlow.functionName,
      description: 'The name of the Lambda function to start the flow',
    });

    startFlowRules.forEach((rule, index) => {
      new cdk.CfnOutput(this, `EventBridgeStartFlowRuleName${index + 1}`, {
        value: rule.ruleName,
        description: `The name of the EventBridge rule ${index + 1} to start the flow`,
      });
    });

    stopFlowRules.forEach((rule, index) => {
      new cdk.CfnOutput(this, `EventBridgeStopFlowRuleName${index + 1}`, {
        value: rule.ruleName,
        description: `The name of the EventBridge rule ${index + 1} to stop the flow`,
      });
    });
  }
}


// // Create the EventBridge rule for starting the flow
// const startFlowSchedule = events.Schedule.expression(`cron(${props.startFlowSchedule})`);
// const startFlowRule = new events.Rule(this, `${props.stackName}-ScheduledEvent-StartFlow`, {
//   ruleName: `${props.stackName}-StartFlow-${props.flowIndex}`,
//   schedule: startFlowSchedule,
//   targets: [new targets.LambdaFunction(lambdaFunctionStartFlow, {
//     event: events.RuleTargetInput.fromObject({ action: 'START', flowArn: props.mediaConnectFlowArn })
//   })],
// });

// // Create the EventBridge rule for stopping the flow
// const stopFlowSchedule = events.Schedule.expression(`cron(${props.stopFlowSchedule})`);
// const stopFlowRule = new events.Rule(this, `${props.stackName}-ScheduledEvent-StopFlow`, {
//   ruleName: `${props.stackName}-StopFlow-${props.flowIndex}`,
//   schedule: stopFlowSchedule,
//   targets: [new targets.LambdaFunction(lambdaFunctionStopFlow, {
//     event: events.RuleTargetInput.fromObject({ action: 'STOP', flowArn: props.mediaConnectFlowArn })
//   })],
// });





//     new cdk.CfnOutput(this, 'LambdaFunctionNameStartFlow', {
//       value: lambdaFunctionStartFlow.functionName,
//       description: 'The name of the Lambda function to start the flow',
//     });

//     new cdk.CfnOutput(this, 'LambdaFunctionNameStopFlow', {
//       value: lambdaFunctionStopFlow.functionName,
//       description: 'The name of the Lambda function to stop the flow',
//     });

//     new cdk.CfnOutput(this, 'EventBridge11AMRuleName', {
//       value: startFlowRule.ruleName,
//       description: 'The name of the EventBridge rule to start the flow',
//     });

//     new cdk.CfnOutput(this, 'EventBridge11PMRuleName', {
//       value: stopFlowRule.ruleName,
//       description: 'The name of the EventBridge rule to stop the flow',
//     });
//   }
// }

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

    const lambdaFunction = new lambda.Function(this, `${props.stackName}-LambdaFunction`, {
      functionName: `${props.stackName}-${props.flowName}`,
      runtime: lambda.Runtime.PYTHON_3_12,
      handler: 'index.lambda_handler',
      code: lambda.Code.fromAsset('lambda'),
      timeout: cdk.Duration.minutes(2.5),
      environment: {
        MEDIACONNECT_FLOW_ARN: props.mediaConnectFlowArn,
      },
      role: new iam.Role(this, `${props.stackName}-LambdaExecutionRole`, {
        assumedBy: new iam.ServicePrincipal('lambda.amazonaws.com'),
        managedPolicies: [
          iam.ManagedPolicy.fromAwsManagedPolicyName(
            'service-role/AWSLambdaBasicExecutionRole'
          ),
        ],
        inlinePolicies: {
          mediaConnectPolicy: mediaConnectPolicyDocument,
        },
      }),
    });

    const schedule11AM = events.Schedule.expression('cron(0 17 * * ? *)');
    const rule11AM = new events.Rule(this, `${props.stackName}-ScheduledEvent-11AM-CT`, {
      schedule: schedule11AM,
      targets: [new targets.LambdaFunction(lambdaFunction)],
    });

    const schedule11PM = events.Schedule.expression('cron(59 23 * * ? *)');
    const rule11PM = new events.Rule(this, `${props.stackName}-ScheduledEvent-11PM-CT`, {
      schedule: schedule11PM,
      targets: [new targets.LambdaFunction(lambdaFunction)],
    });


    new cdk.CfnOutput(this, 'LambdaFunctionName', {
      value: lambdaFunction.functionName,
      description: 'The name of the Lambda function',
    });

    new cdk.CfnOutput(this, 'EventBridge11AMRuleName', {
      value: rule11AM.ruleName,
      description: 'The name of the 11:00 AM CT EventBridge rule',
    });

    new cdk.CfnOutput(this, 'EventBridge11PMRuleName', {
      value: rule11PM.ruleName,
      description: 'The name of the 11:59 PM CT EventBridge rule',
    });
  }
}

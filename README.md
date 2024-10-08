### MediaConnect Scheduler

In order to use CDK, you need:

- [AWS CLI](https://docs.aws.amazon.com/cli/latest/userguide/getting-started-install.html)
- [AWS CDK](https://developer.hashicorp.com/terraform/tutorials/cdktf/cdktf-install)

## Commands to Deploy

1. Install required node dependencies

```sh
npm install
```

2. Configure your terminal environment for connecting to your AWS account. There are many ways to achieve this, here are some methods:

   - [aws configure](https://docs.aws.amazon.com/cli/latest/userguide/cli-chap-configure.html)
   - [AWS Environment Variables](https://docs.aws.amazon.com/cli/latest/userguide/cli-configure-envvars.html)
   - [aws sso login](https://docs.aws.amazon.com/cli/latest/userguide/cli-configure-sso.html)

3. You may need to bootstrap your environment if it hasn't been bootstrapped already.

```sh
cdk bootstrap
```


4. Deploy the AWS Elemental MediaConnect Scheduler using:

```sh
//Specify which MediaConncet Fow you want the CDK app to deploy the scheduler, example below:
//cdk deploy -c mediaConnectFlowArn=arn:aws:mediaconnect:us-east-1:012345678910:flow:flowID:flowName

cdk deploy -c mediaConnectFlowArn==<MEDIACONNECT-FLOW-ARN>
```

The CDK outputs CloudFormation templates to the `cdk.out` folder. By running the following command you will be able to access these templates at `CreateFlow.template.json`

---


## Troubleshoot

- Try deleting the `cdk.out` folder and redeploy if you're receiving issues.

- If you receive a token error when deploying, make sure you are connected to your AWS account. It's likely that your session is not connected.

- You can also destroy the stack and redeploy if you're running into deployment issues.

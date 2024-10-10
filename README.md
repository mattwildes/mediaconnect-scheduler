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

4. Edit the configuration JSON file located in the config directory:

```sh
nano ./config/config.json
```

5. Update the values to the cooresponding `FlowArn`, `StartFlowSchedules`, and `StopFlowSchedules` keys in the config.json file. 


```sh
{
  "Schedules": [
    {
      "FlowArn": "arn:aws:mediaconnect:us-east-1:<ACCOUNT-NUMBER>:flow:<FLOW-ID>:<FLOW-NAME>",
      "StartFlowSchedules": ["0 17 * * ? *", "0 9 * * ? *"],
      "StopFlowSchedules": ["59 23 * * ? *", "59 15 * * ? *"] 
    },
    {
      "FlowArn": "arn:aws:mediaconnect:us-east-1:<ACCOUNT-NUMBER>:flow:<FLOW-ID>:<FLOW-NAME>",
      "StartFlowSchedules": ["0 18 * * ? *"],
      "StopFlowSchedules": ["59 23 * * ? *"]
    },
    {
      "FlowArn": "",
      "StartFlowSchedules": [],
      "StopFlowSchedules": []
    }
  ]
}
```

- Save and close the config.json file using the keyboard shortcut (Ctrl-x).

6. Deploy the AWS Elemental MediaConnect Scheduler using:

```sh
cdk deploy --all
```

The CDK outputs CloudFormation templates to the `cdk.out` folder. By running the following command you will be able to access these templates at `CreateFlow.template.json`

---


## Troubleshoot

- Try deleting the `cdk.out` folder and redeploy if you're receiving issues.

- If you receive a token error when deploying, make sure you are connected to your AWS account. It's likely that your session is not connected.

- You can also destroy the stack and redeploy if you're running into deployment issues.

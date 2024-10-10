import os
import json
import boto3
import time
from botocore.exceptions import ClientError

def lambda_handler(event, context):
    # Get the MediaConnect flow ARN from the environment variable
    flow_arn = os.environ['MEDIACONNECT_FLOW_ARN']

    # Create a MediaConnect client
    mediaconnect = boto3.client('mediaconnect')

    def get_flow_state(response):
        if 'Status' in response:
            return response['Status']
        elif 'Flow' in response and 'Status' in response['Flow']:
            return response['Flow']['Status']
        elif 'Flow' in response and 'State' in response['Flow']:
            return response['Flow']['State']
        else:
            raise KeyError("Unable to find flow state in the response")

    def wait_for_flow_state(desired_state, max_time=150, initial_delay=1):
        start_time = time.time()
        attempt = 0
        while time.time() - start_time < max_time:
            try:
                response = mediaconnect.describe_flow(FlowArn=flow_arn)
                current_state = get_flow_state(response)
                print(f"Current state of the MediaConnect flow: {current_state}")

                if current_state == desired_state:
                    return current_state
                elif current_state == 'STANDBY':
                    print("Flow is already stopped. No action needed.")
                    return current_state
                elif current_state in ['STARTING', 'ACTIVE']:
                    print("Stopping the MediaConnect flow...")
                    mediaconnect.stop_flow(FlowArn=flow_arn)
                else:
                    print(f"Flow in transitional state: {current_state}. Waiting...")

                delay = min(initial_delay * (2 ** attempt), max_time - (time.time() - start_time))
                time.sleep(delay)
                attempt += 1
            except ClientError as e:
                print(f"An error occurred: {str(e)}")
                delay = min(initial_delay * (2 ** attempt), max_time - (time.time() - start_time))
                time.sleep(delay)
                attempt += 1

        raise Exception(f"Failed to reach desired state after {max_time} seconds")

    try:
        initial_state = get_flow_state(mediaconnect.describe_flow(FlowArn=flow_arn))
        print(f"Initial state of the MediaConnect flow: {initial_state}")

        if initial_state in ['STARTING', 'ACTIVE']:
            final_state = wait_for_flow_state('STANDBY')
            action = "Stopped"
        elif initial_state == 'STANDBY':
            print("Flow is already stopped. No action needed.")
            final_state = initial_state
            action = "No action"
        else:
            print(f"Flow is in an unexpected state: {initial_state}. Attempting to stop...")
            final_state = wait_for_flow_state('STANDBY')
            action = "Stopped"

        return {
            'statusCode': 200,
            'body': json.dumps({
                'message': f"MediaConnect flow state: {initial_state} -> {final_state}",
                'action': action
            })
        }
    except Exception as e:
        error_message = str(e)
        print(f"An error occurred: {error_message}")
        return {
            'statusCode': 500,
            'body': json.dumps({'error': error_message})
        }

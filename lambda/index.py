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

    def exponential_backoff(max_time=150, initial_delay=1):
        start_time = time.time()
        attempt = 0
        while time.time() - start_time < max_time:
            try:
                response = mediaconnect.describe_flow(FlowArn=flow_arn)
                current_state = get_flow_state(response)
                print(f"Current state of the MediaConnect flow: {current_state}")

                if current_state == 'ACTIVE':
                    print("Stopping the MediaConnect flow...")
                    mediaconnect.stop_flow(FlowArn=flow_arn)
                    return "Stopped", current_state
                elif current_state == 'STANDBY':
                    print("Starting the MediaConnect flow...")
                    mediaconnect.start_flow(FlowArn=flow_arn)
                    return "Started", current_state
                else:
                    print(f"Flow in transitional state: {current_state}. Retrying...")
                    delay = min(initial_delay * (2 ** attempt), max_time - (time.time() - start_time))
                    time.sleep(delay)
                    attempt += 1
            except ClientError as e:
                print(f"An error occurred: {str(e)}")
                delay = min(initial_delay * (2 ** attempt), max_time - (time.time() - start_time))
                time.sleep(delay)
                attempt += 1

        raise Exception(f"Failed to toggle flow state after {max_time} seconds")

    try:
        action, initial_state = exponential_backoff()

        # Describe the updated state of the MediaConnect flow
        response = mediaconnect.describe_flow(FlowArn=flow_arn)
        print(f"Updated describe flow response: {json.dumps(response, default=str)}")
        
        updated_state = get_flow_state(response)
        print(f"Updated state of the MediaConnect flow: {updated_state}")

        return {
            'statusCode': 200,
            'body': f"MediaConnect flow state toggled: {initial_state} -> {updated_state}"
        }
    except Exception as e:
        error_message = str(e)
        print(f"An error occurred: {error_message}")
        return {
            'statusCode': 500,
            'body': f"An error occurred: {error_message}"
        }

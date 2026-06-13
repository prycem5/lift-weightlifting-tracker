import * as cdk from 'aws-cdk-lib/core';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import * as cognito from 'aws-cdk-lib/aws-cognito';
import * as apigateway from 'aws-cdk-lib/aws-apigateway';
import { Construct } from 'constructs';
// import * as sqs from 'aws-cdk-lib/aws-sqs';

export class InfraStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // The code that defines your stack goes here

    // example resource
    // const queue = new sqs.Queue(this, 'InfraQueue', {
    //   visibilityTimeout: cdk.Duration.seconds(300)
    // });

    // Defining DynamoDB table for lift entities (users, exercises, sessions, sets, etc.)
    const liftEntities = new dynamodb.Table(this, 'liftEntities', {
      tableName: 'liftEntities',
      partitionKey: { name: 'PK', type: dynamodb.AttributeType.STRING },
      sortKey: {name: 'SK', type: dynamodb.AttributeType.STRING},
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST, // Cost efficient for starting out
    });

    const userPool = new cognito.UserPool(this, 'UserPool', {
      signInAliases: { email: true },
      selfSignUpEnabled: true,
      autoVerify: { email: true }
    });

    const userPoolClient = userPool.addClient('NextJsAppClient', {
       authFlows: { userSrp: true}
    });

    //API Gateway setup
    const api = new apigateway.RestApi(this, 'listAPI', {
        restApiName: 'liftAPI',
        defaultCorsPreflightOptions: {
        allowOrigins: apigateway.Cors.ALL_ORIGINS, // Adjust down for production security
        allowMethods: apigateway.Cors.ALL_METHODS,
      },
    });

    // Outputs to easily pass directly to your Next.js frontend config
    new cdk.CfnOutput(this, 'UserPoolId', { value: userPool.userPoolId });
    new cdk.CfnOutput(this, 'UserPoolClientId', { value: userPoolClient.userPoolClientId });
    new cdk.CfnOutput(this, 'ApiUrl', { value: api.url });
  }
}

import * as cdk from 'aws-cdk-lib/core';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import * as cognito from 'aws-cdk-lib/aws-cognito';
import * as apigateway from 'aws-cdk-lib/aws-apigateway';
import dotenv from 'dotenv';
import { Construct } from 'constructs';
// import * as sqs from 'aws-cdk-lib/aws-sqs';

dotenv.config({path: './.env.local'});

export class InfraStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // The code that defines your stack goes here

    // single liftEntites table with combination key allows for flexible data modeling. 
    const liftEntities = new dynamodb.Table(this, 'liftEntities', {
      tableName: 'liftEntities',
      partitionKey: { name: 'PK', type: dynamodb.AttributeType.STRING },
      sortKey: {name: 'SK', type: dynamodb.AttributeType.STRING},
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST, // most cost-effective for variable workloads.
    });

    // pointers to code defined in /lambda, which will be integrated within the api gateway.
    const getEntity = new lambda.Function(this, 'getEntity', {
      runtime: lambda.Runtime.NODEJS_20_X,
      handler: 'getEntity.handler',
      code: lambda.Code.fromAsset('lambda'),
      environment: {TABLE_NAME: liftEntities.tableName},
    });

    const createEntity = new lambda.Function(this, 'createEntity', {
      runtime: lambda.Runtime.NODEJS_20_X,
      handler: 'createEntity.handler',
      code: lambda.Code.fromAsset('lambda'),
      environment: {TABLE_NAME: liftEntities.tableName, ADMIN_ID: process.env.ADMIN_ID || ''}, // when targeting user and exercise creation, not usable by general users.
    });

    const updateEntity = new lambda.Function(this, 'updateEntity', {
      runtime: lambda.Runtime.NODEJS_20_X,
      handler: 'updateEntity.handler',
      code: lambda.Code.fromAsset('lambda'),
      environment: {TABLE_NAME: liftEntities.tableName}
    });

    const deleteEntity = new lambda.Function(this, 'deleteEntity', {
      runtime: lambda.Runtime.NODEJS_20_X,
      handler: 'deleteEntity.handler',
      code: lambda.Code.fromAsset('lambda'),
      environment: {TABLE_NAME: liftEntities.tableName, ADMIN_ID: process.env.ADMIN_ID || ''}
    });

    liftEntities.grantReadData(getEntity);
    liftEntities.grantWriteData(createEntity);
    liftEntities.grantReadWriteData(updateEntity);
    liftEntities.grantWriteData(deleteEntity);

    const userPool = new cognito.UserPool(this, 'liftUserPool', {
      signInAliases: { email: true },
      selfSignUpEnabled: true,
      autoVerify: { email: true },
      passwordPolicy: {minLength: 8, requireLowercase: true, requireUppercase: true, requireDigits: true}
    });

    const userPoolClient = userPool.addClient('liftUserPoolClient', {
       authFlows: { userSrp: true, userPassword: true} // passwords never traverse the network, secure authentication protocol.
    });

    // prevents unauthroized access to api methods. Only authenticated users may access. Verification still required so users can only perform
    // actions on their own data.
    const auth = new apigateway.CognitoUserPoolsAuthorizer(this, 'liftAPIAuthorizer', {
      cognitoUserPools: [userPool]
    });

    // api getway setup. allowOrigins should be adjusted for production to only allow the frontend domain.
    const api = new apigateway.RestApi(this, 'liftAPI', {
        restApiName: 'liftAPI',
        defaultCorsPreflightOptions: { // creates universal rules between all endpoints, determining how the api can be accessed.
        allowOrigins: apigateway.Cors.ALL_ORIGINS, // ADJUST FOR PRODUCTION. 
        allowMethods: apigateway.Cors.ALL_METHODS,
      },
    });

    // structure for api endpoints with integrations with lambda functions. Structure mirrors 
    // data schema.
    const users = api.root.addResource('users');
    const user = users.addResource('{userId}');
    const workouts = user.addResource('workouts');
    const workout = workouts.addResource('{workoutId}');
    const sets = workout.addResource('sets');
    const set = sets.addResource('{setId}');


    // exercises are available to all users. Exercises may only be created by admin users for now.
    // user created exercises mayy be added later as an additional resource.
    const exercises = api.root.addResource('exercises');
    const exercise = exercises.addResource('{exerciseId}');


    let main = [users, workouts, sets, exercises];
    let sub = [user, workout, set, exercise];

    for (let resource of main) {
      resource.addMethod('GET', new apigateway.LambdaIntegration(getEntity), {authorizer: auth, authorizationType: apigateway.AuthorizationType.COGNITO});
      resource.addMethod('POST', new apigateway.LambdaIntegration(createEntity), {authorizer: auth, authorizationType: apigateway.AuthorizationType.COGNITO});
    }

    for (let resource of sub) {
      resource.addMethod('GET', new apigateway.LambdaIntegration(getEntity), {authorizer: auth, authorizationType: apigateway.AuthorizationType.COGNITO});
      resource.addMethod('PUT', new apigateway.LambdaIntegration(updateEntity), {authorizer: auth, authorizationType: apigateway.AuthorizationType.COGNITO});
      resource.addMethod('DELETE', new apigateway.LambdaIntegration(deleteEntity), {authorizer: auth, authorizationType: apigateway.AuthorizationType.COGNITO});
    }

    // outputs to easily pass directly to the Next.js frontend config
    new cdk.CfnOutput(this, 'UserPoolId', { value: userPool.userPoolId });
    new cdk.CfnOutput(this, 'UserPoolClientId', { value: userPoolClient.userPoolClientId });
    new cdk.CfnOutput(this, 'ApiUrl', { value: api.url });
  }
}

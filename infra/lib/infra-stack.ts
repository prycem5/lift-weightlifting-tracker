import * as cdk from 'aws-cdk-lib/core';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import * as cognito from 'aws-cdk-lib/aws-cognito';
import * as apigateway from 'aws-cdk-lib/aws-apigateway';
import dotenv from 'dotenv';
import { Construct } from 'constructs';
// import * as sqs from 'aws-cdk-lib/aws-sqs';

dotenv.config({ path: './.env.local' });

export class InfraStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // The code that defines your stack goes here

    // one composite-key table lets each entity type use the same storage while retaining
    // efficient ownership and collection queries. see https://docs.aws.amazon.com/amazondynamodb/latest/developerguide/HowItWorks.CoreComponents.html.
    const liftEntities = new dynamodb.Table(this, 'liftEntities', {
      tableName: 'liftEntities',
      partitionKey: { name: 'PK', type: dynamodb.AttributeType.STRING },
      sortKey: { name: 'SK', type: dynamodb.AttributeType.STRING },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST, // most cost-effective for variable workloads.
    });

    // the gsi supports collection and id lookups for shared exercises without scanning
    // the whole table. see https://docs.aws.amazon.com/amazondynamodb/latest/developerguide/GSI.html.
    liftEntities.addGlobalSecondaryIndex({
      indexName: 'liftEntitiesGSI',
      partitionKey: { name: 'entityType', type: dynamodb.AttributeType.STRING },
      sortKey: { name: 'entityId', type: dynamodb.AttributeType.STRING },
      projectionType: dynamodb.ProjectionType.ALL
    });

    // these functions package the handlers in /lambda for api gateway and cognito; each
    // function receives only the table permissions required by its operation.
    const getEntity = new lambda.Function(this, 'getEntity', {
      runtime: lambda.Runtime.NODEJS_20_X,
      handler: 'getEntity.handler',
      code: lambda.Code.fromAsset('lambda'),
      environment: { TABLE_NAME: liftEntities.tableName },
    });

    const createEntity = new lambda.Function(this, 'createEntity', {
      runtime: lambda.Runtime.NODEJS_20_X,
      handler: 'createEntity.handler',
      code: lambda.Code.fromAsset('lambda'),
      environment: { TABLE_NAME: liftEntities.tableName, ADMIN_ID: process.env.ADMIN_ID || '' }, // when targeting user and exercise creation, not usable by general users.
    });

    const updateEntity = new lambda.Function(this, 'updateEntity', {
      runtime: lambda.Runtime.NODEJS_20_X,
      handler: 'updateEntity.handler',
      code: lambda.Code.fromAsset('lambda'),
      environment: { TABLE_NAME: liftEntities.tableName, ADMIN_ID: process.env.ADMIN_ID || '' }
    });

    const deleteEntity = new lambda.Function(this, 'deleteEntity', {
      runtime: lambda.Runtime.NODEJS_20_X,
      handler: 'deleteEntity.handler',
      code: lambda.Code.fromAsset('lambda'),
      environment: { TABLE_NAME: liftEntities.tableName, ADMIN_ID: process.env.ADMIN_ID || '' }
    });

    const postConfirmation = new lambda.Function(this, 'postConfirmation', {
      runtime: lambda.Runtime.NODEJS_20_X,
      handler: 'postConfirmation.handler',
      code: lambda.Code.fromAsset('lambda/cognito'),
      environment: { TABLE_NAME: liftEntities.tableName }
    });

    const preToken = new lambda.Function(this, 'preToken', {
      runtime: lambda.Runtime.NODEJS_20_X,
      handler: 'preToken.handler',
      code: lambda.Code.fromAsset('lambda/cognito'),
      environment: { TABLE_NAME: liftEntities.tableName }
    });

    liftEntities.grantReadData(getEntity);
    liftEntities.grantWriteData(createEntity);
    liftEntities.grantReadWriteData(updateEntity);
    liftEntities.grantReadWriteData(deleteEntity);
    liftEntities.grantWriteData(postConfirmation);
    liftEntities.grantReadWriteData(preToken);

    const userPool = new cognito.UserPool(this, 'liftUserPool', {
      signInAliases: { email: true },
      selfSignUpEnabled: true,
      autoVerify: { email: true },
      passwordPolicy: { minLength: 8, requireLowercase: true, requireUppercase: true, requireDigits: true }
    });

    userPool.addTrigger(cognito.UserPoolOperation.POST_CONFIRMATION, postConfirmation);
    userPool.addTrigger(cognito.UserPoolOperation.PRE_TOKEN_GENERATION, preToken);

    const userPoolClient = userPool.addClient('liftUserPoolClient', {
      authFlows: { userSrp: true, userPassword: true } // passwords never traverse the network, secure authentication protocol.
    });


    // api gateway rejects requests without a valid cognito token before invoking a handler.
    // the handlers still enforce ownership because authentication alone does not identify
    // which resource a caller is allowed to modify.
    const auth = new apigateway.CognitoUserPoolsAuthorizer(this, 'liftAPIAuthorizer', {
      cognitoUserPools: [userPool]
    });


    // cors is open during development; restrict alloworigins to the deployed frontend
    // domain before production. see https://docs.aws.amazon.com/apigateway/latest/developerguide/how-to-cors.html.
    const api = new apigateway.RestApi(this, 'liftAPI', {
      restApiName: 'liftAPI',
      defaultCorsPreflightOptions: { // creates universal rules between all endpoints, determining how the api can be accessed.
        allowOrigins: apigateway.Cors.ALL_ORIGINS, // ADJUST FOR PRODUCTION. 
        allowMethods: apigateway.Cors.ALL_METHODS,
        allowHeaders: [
          'Content-Type',
          'X-Amz-Date',
          'Authorization',
          'X-Api-Key',
          'X-Amz-Security-Token',
        ],
      },
    });

    // endpoint paths mirror the entity schema. collection resources support get/post,
    // while item resources support get/put/delete and receive an id in the path.
    const users = api.root.addResource('user');
    const workouts = api.root.addResource('workout');
    const workout = workouts.addResource('{workoutId}');
    const sets = api.root.addResource('set');
    const set = sets.addResource('{setId}');
    const prs = api.root.addResource('pr');
    const pr = prs.addResource('{prId}');


    // exercises are available to all users. Exercises may only be created by admin users for now.
    // user created exercises may be added later as an additional resource.
    const exercises = api.root.addResource('exercise');
    const exercise = exercises.addResource('{exerciseId}');


    let main = [users, workouts, sets, exercises, prs];
    let sub = [workout, set, exercise, pr];

    for (let resource of main) {
      resource.addMethod('GET', new apigateway.LambdaIntegration(getEntity), { authorizer: auth, authorizationType: apigateway.AuthorizationType.COGNITO });
      resource.addMethod('POST', new apigateway.LambdaIntegration(createEntity), { authorizer: auth, authorizationType: apigateway.AuthorizationType.COGNITO });
    }

    for (let resource of sub) {
      resource.addMethod('GET', new apigateway.LambdaIntegration(getEntity), { authorizer: auth, authorizationType: apigateway.AuthorizationType.COGNITO });
      resource.addMethod('PUT', new apigateway.LambdaIntegration(updateEntity), { authorizer: auth, authorizationType: apigateway.AuthorizationType.COGNITO });
      resource.addMethod('DELETE', new apigateway.LambdaIntegration(deleteEntity), { authorizer: auth, authorizationType: apigateway.AuthorizationType.COGNITO });
    }

    users.addMethod('PUT', new apigateway.LambdaIntegration(updateEntity), { authorizer: auth, authorizationType: apigateway.AuthorizationType.COGNITO })

    // outputs to easily pass directly to the Next.js frontend config.
    new cdk.CfnOutput(this, 'UserPoolId', { value: userPool.userPoolId });
    new cdk.CfnOutput(this, 'UserPoolClientId', { value: userPoolClient.userPoolClientId });
    new cdk.CfnOutput(this, 'ApiUrl', { value: api.url });
  }
}

import * as cdk from "aws-cdk-lib";
import { Construct } from "constructs";

import { AttributeType, BillingMode, Table } from "aws-cdk-lib/aws-dynamodb";
import {
  DockerImageFunction,
  DockerImageCode,
  FunctionUrlAuthType,
  Architecture,
} from "aws-cdk-lib/aws-lambda";
import { ManagedPolicy } from "aws-cdk-lib/aws-iam";

export class RagCdkInfraStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // Create a DynamoDB table to store the query data and results.
    const ragQueryTable = new Table(this, "RagQueryTable", {
      partitionKey: { name: "query_id", type: AttributeType.STRING },
      billingMode: BillingMode.PAY_PER_REQUEST,
    });

    // Lambda function (image) to handle the worker logic (run RAG/AI model).
    const workerImageCode = DockerImageCode.fromImageAsset("../image", {
      cmd: ["app_work_handler.handler"],
      buildArgs: {
        platform: "linux/amd64", // Needs x86_64 architecture for pysqlite3-binary.
      },
    });
    const workerFunction = new DockerImageFunction(this, "RagWorkerFunction", {
      code: workerImageCode,
      memorySize: 512, // Increase this if you need more memory.
      timeout: cdk.Duration.seconds(60), // Increase this if you need more time.
      architecture: Architecture.X86_64, // Needs to be the same as the image.
      environment: {
        TABLE_NAME: ragQueryTable.tableName,
      },
    });

    // Function to handle the API requests. Uses same base image, but different handler.
    const apiImageCode = DockerImageCode.fromImageAsset("../image", {
      cmd: ["app_api_handler.handler"],
      buildArgs: {
        platform: "linux/amd64",
      },
    });
    const apiFunction = new DockerImageFunction(this, "ApiFunc", {
      code: apiImageCode,
      memorySize: 256,
      timeout: cdk.Duration.seconds(30),
      architecture: Architecture.X86_64,
      environment: {
        TABLE_NAME: ragQueryTable.tableName,
        WORKER_LAMBDA_NAME: workerFunction.functionName,
      },
    });

    // Public URL for the API function.
    const functionUrl = apiFunction.addFunctionUrl({
      authType: FunctionUrlAuthType.NONE,
    });

    // Grant permissions for all resources to work together.
    ragQueryTable.grantReadWriteData(workerFunction);
    ragQueryTable.grantReadWriteData(apiFunction);
    workerFunction.grantInvoke(apiFunction);
    workerFunction.role?.addManagedPolicy(
      ManagedPolicy.fromAwsManagedPolicyName("AmazonBedrockFullAccess")
    );

    // Output the URL for the API function.
    new cdk.CfnOutput(this, "FunctionUrl", {
      value: functionUrl.url,
    });
  }
}

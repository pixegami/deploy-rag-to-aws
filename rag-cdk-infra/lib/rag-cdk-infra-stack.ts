import * as cdk from "aws-cdk-lib";
import { Construct } from "constructs";

import { AttributeType, BillingMode, Table } from "aws-cdk-lib/aws-dynamodb";
import {
  DockerImageFunction,
  DockerImageCode,
  Architecture,
} from "aws-cdk-lib/aws-lambda";
import { ManagedPolicy } from "aws-cdk-lib/aws-iam";
import {
  BasePathMapping,
  DomainName,
  LambdaRestApi,
} from "aws-cdk-lib/aws-apigateway";
import { ARecord, HostedZone, RecordTarget } from "aws-cdk-lib/aws-route53";
import {
  Certificate,
  CertificateValidation,
} from "aws-cdk-lib/aws-certificatemanager";
import { ApiGatewayDomain } from "aws-cdk-lib/aws-route53-targets";

export class RagCdkInfraStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // Create a DynamoDB table to store the query data and results.
    const ragQueryTable = new Table(this, "RagQueryTable", {
      partitionKey: { name: "query_id", type: AttributeType.STRING },
      billingMode: BillingMode.PAY_PER_REQUEST,
      timeToLiveAttribute: "ttl",
    });

    // Add secondary index, to query by user_id and create_time.
    ragQueryTable.addGlobalSecondaryIndex({
      indexName: "queries_by_user_id",
      partitionKey: { name: "user_id", type: AttributeType.STRING },
      sortKey: { name: "create_time", type: AttributeType.NUMBER },
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

    // Grant permissions for all resources to work together.
    ragQueryTable.grantReadWriteData(workerFunction);
    ragQueryTable.grantReadWriteData(apiFunction);
    workerFunction.grantInvoke(apiFunction);
    workerFunction.role?.addManagedPolicy(
      ManagedPolicy.fromAwsManagedPolicyName("AmazonBedrockFullAccess")
    );

    // Create a domain API
    // Create API Gateway
    const api = new LambdaRestApi(this, "MyApi", {
      handler: apiFunction,
    });

    // Specify your domain name
    const domainName = "api.rag.pixegami.io";

    // Get the hosted zone by domain name
    const hostedZone = HostedZone.fromLookup(this, "HostedZone", {
      domainName: "pixegami.io",
    });

    // Create a certificate for the domain name
    const certificate = new Certificate(this, "Certificate", {
      domainName: domainName,
      validation: CertificateValidation.fromDns(hostedZone),
    });

    // Create a custom domain for the API Gateway
    const customDomain = new DomainName(this, "CustomDomain", {
      domainName: domainName,
      certificate: certificate,
    });

    // Map the custom domain to the API Gateway
    new BasePathMapping(this, "BasePathMapping", {
      domainName: customDomain,
      restApi: api,
    });

    // Create a Route53 record to point to the API Gateway custom domain
    new ARecord(this, "ApiAliasRecord", {
      zone: hostedZone,
      target: RecordTarget.fromAlias(new ApiGatewayDomain(customDomain)),
      recordName: domainName,
    });

    // Output the URL for the API function.
    new cdk.CfnOutput(this, "FunctionUrl", {
      value: api.url,
    });
  }
}

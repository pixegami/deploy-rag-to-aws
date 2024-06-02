import * as cdk from "aws-cdk-lib";
import { Construct } from "constructs";

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
    });

    // Public URL for the API function.
    const functionUrl = apiFunction.addFunctionUrl({
      authType: FunctionUrlAuthType.NONE,
    });

    // Grant permissions for all resources to work together.
    apiFunction.role?.addManagedPolicy(
      ManagedPolicy.fromAwsManagedPolicyName("AmazonBedrockFullAccess")
    );

    // Output the URL for the API function.
    new cdk.CfnOutput(this, "FunctionUrl", {
      value: functionUrl.url,
    });
  }
}

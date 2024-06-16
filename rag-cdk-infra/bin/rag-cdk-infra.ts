#!/usr/bin/env node
import "source-map-support/register";
import * as cdk from "aws-cdk-lib";
import { RagCdkInfraStack } from "../lib/rag-cdk-infra-stack";

const app = new cdk.App();
new RagCdkInfraStack(app, "PxResourceRagApiStack", {
  /* If you don't specify 'env', this stack will be environment-agnostic.
   * Account/Region-dependent features and context lookups will not work,
   * but a single synthesized template can be deployed anywhere. */

  env: { account: "469587240578", region: "us-west-2" },
  /* For more information, see https://docs.aws.amazon.com/cdk/latest/guide/environments.html */
});

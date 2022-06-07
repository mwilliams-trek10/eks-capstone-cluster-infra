#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import EksCapstoneClusterPipeline from "../lib/eks-capstone-cluster-pipeline";
import {DefaultStackSynthesizer, StackProps} from "aws-cdk-lib";
import EksCapstoneCluster from "../lib/eks-capstone-cluster";

const account = process.env.CDK_DEFAULT_ACCOUNT;
const region = process.env.CDK_DEFAULT_REGION;
const props: StackProps = {
    env: {account, region},
    synthesizer: new DefaultStackSynthesizer({
        qualifier: 'mcw-eks'
    })
};

const app = new cdk.App();

const id: string = 'eks-capstone-cluster-infra';

new EksCapstoneCluster(app, id+'-cluster', props);
new EksCapstoneClusterPipeline(app, id+'-pipeline', props);


/*
cdk bootstrap --toolkit-stack-name=mcw-eks-blueprint --qualifier=mcw-eks

arn:aws:iam::549005336969:role/eks-capstone-cluster-infr-ekscapstoneclusterinfrap-P5X6U613JKQX

message:
arn:aws:iam::549005336969:role/cdk-mcw-eks-cfn-exec-role-549005336969-ca-central-1

actual arn:
arn:aws:iam::549005336969:role/cdk-mcw-eks-cfn-exec-role-549005336969-ca-central-1

 */

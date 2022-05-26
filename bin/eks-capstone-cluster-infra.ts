#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import EksCapstoneClusterPipeline from "../lib/eks-capstone-cluster-pipeline";
import {DefaultStackSynthesizer, StackProps} from "aws-cdk-lib";

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

//new EksCapstoneClusterInfraStack(app, id+'-stack', props);
new EksCapstoneClusterPipeline(app, id+'-pipeline', props);


/*
cdk bootstrap --toolkit-stack-name=mcw-eks-blueprint --qualifier=mcw-eks-bp

 */

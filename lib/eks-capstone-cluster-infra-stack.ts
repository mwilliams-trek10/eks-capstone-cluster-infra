import { Construct } from 'constructs';
import * as blueprints from '@aws-quickstart/eks-blueprints';
import * as cdk from 'aws-cdk-lib';

export default class EksCapstoneClusterInfraStack extends Construct {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id);

    // Extract values from the props parameter.\
    const account = props?.env?.account!;
    const region = props?.env?.region!;

    blueprints.EksBlueprint
        .builder()
        .account(account)
        .region(region)
        .addOns()
        .build(scope, id+'-blueprint');
  }
}

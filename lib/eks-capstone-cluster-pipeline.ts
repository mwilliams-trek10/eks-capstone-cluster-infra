import { Construct } from 'constructs';
import * as blueprints from '@aws-quickstart/eks-blueprints';
import {
    ApplicationRepository,
    ArgoCDAddOn, AwsLoadBalancerControllerAddOn, CalicoAddOn,
    CoreDnsAddOn,
    KarpenterAddOn,
    KubeProxyAddOn,
    StackStage, Team,
    VpcCniAddOn
} from "@aws-quickstart/eks-blueprints";
import * as cdk from 'aws-cdk-lib';
import {GitHubSourceRepository} from "@aws-quickstart/eks-blueprints/dist/pipelines/code-pipeline";
import * as team from "../Teams";
import {AwsLoadBalancerControllerProps} from "@aws-quickstart/eks-blueprints/dist/addons/aws-loadbalancer-controller";

export default class EksCapstoneClusterPipeline extends Construct {
    constructor(scope: Construct, id: string, props?: cdk.StackProps) {
        super(scope, id);

        // ArgoCD Workloads Repo URL:
        const argoCdRepo: ApplicationRepository = {
            repoUrl: '',
        }

        // Extract values from the props parameter.
        const account = props?.env?.account!;
        const region = props?.env?.region!;

        /******************************
         Teams
         ******************************/
        const teams: Team[] = team.getTeams(account);

        /******************************
         Add Ons
         ******************************/
        const awsLoadBalancerControllerProps: AwsLoadBalancerControllerProps = {
            createIngressClassResource: true,
            enableWaf: true,
            ingressClass: 'alb'
        };
        const awsLoadBalancerControllerAddOn: AwsLoadBalancerControllerAddOn = new AwsLoadBalancerControllerAddOn(awsLoadBalancerControllerProps);

        const kubeProxyAddOn: KubeProxyAddOn = new KubeProxyAddOn();

        const coreDnsAddOn: CoreDnsAddOn = new CoreDnsAddOn();

        const vpcCniAddOn: VpcCniAddOn = new VpcCniAddOn();

        const calicoAddOn: CalicoAddOn = new CalicoAddOn();

        // Karpenter:
        const karpenterAddOn: KarpenterAddOn = new blueprints.KarpenterAddOn({
            provisionerSpecs: {
                "node.kubernetes.io/instance-type": ['t3.micro'],
                "kubernetes.io/arch": ['x86-64'],
                "karpenter.sh/capacity-type": ['spot']
            }
        });

        // Create base blueprint.
        const blueprint = blueprints.EksBlueprint.builder()
            .account(account)
            .region(region)
            .addOns(awsLoadBalancerControllerAddOn, kubeProxyAddOn, coreDnsAddOn, vpcCniAddOn, karpenterAddOn, calicoAddOn)
            .teams(...teams);

        /******************************
         Stages
         ******************************/
        const devStageArgoCd: ArgoCDAddOn = getArgoCdAddOnStage(argoCdRepo, 'env/dev');
        const devStage: StackStage = {
            id: 'dev',
            stackBuilder: blueprint.clone(region, account).addOns(devStageArgoCd),
        };

        const qaStageArgoCd: ArgoCDAddOn = getArgoCdAddOnStage(argoCdRepo, 'env/qa');
        const qaStage: StackStage = {
            id: 'qa',
            stackBuilder: blueprint.clone(region, account).addOns(qaStageArgoCd)
        };

        const prodStageArgoCd: ArgoCDAddOn = getArgoCdAddOnStage(argoCdRepo, 'env/prod');
        const prodStage: StackStage = {
            id: 'prod',
            stackBuilder: blueprint.clone(region, account).addOns(prodStageArgoCd)
        };

        // const prodDrStageArgoCd: ArgoCDAddOn = getArgoCdAddOnStage(argoCdRepo, 'env/prod');
        // const prodDrStage: StackStage = {
        //     id: 'prod-dr',
        //     stackBuilder: blueprint.clone('us-west-2', account).addOns(prodDrStageArgoCd)
        // };

        /******************************
         Build Pipeline
         ******************************/

        const repo: GitHubSourceRepository = {
            credentialsSecretName: 'mcw-github-token',
            repoUrl: 'eks-capstone-cluster-infra',
            targetRevision: 'main'
        };

        blueprints.CodePipelineStack.builder()
            .name('eks-capstone-cluster-infra-pipeline')
            .owner('mwilliams-trek10')
            .repository(repo)
            .stage(devStage)
            // .stage(qaStage)
            // .wave({
            //     id: "production-wave",
            //     stages: [prodStage /*, prodDrStage*/]
            // })
            .build(scope, id+'-blueprint', props)
    }
}

const getArgoCdAddOnStage = function (argoCdRepo: ApplicationRepository, workloadPath: string) : ArgoCDAddOn {
    return new blueprints.ArgoCDAddOn({
        bootstrapRepo: {
            ...argoCdRepo,
            path: workloadPath
        }
    });
}

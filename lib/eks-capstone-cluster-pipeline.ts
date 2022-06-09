import { Construct } from 'constructs';
import * as blueprints from '@aws-quickstart/eks-blueprints';
import {
    ApplicationRepository,
    ArgoCDAddOn, AwsLoadBalancerControllerAddOn, CalicoAddOn, ClusterBuilder, ClusterProvider,
    CoreDnsAddOn, EksBlueprintProps,
    KarpenterAddOn,
    KubeProxyAddOn, MetricsServerAddOn, MngClusterProviderProps,
    StackStage, Team,
    VpcCniAddOn
} from "@aws-quickstart/eks-blueprints";
import * as cdk from 'aws-cdk-lib';
import {GitHubSourceRepository} from "@aws-quickstart/eks-blueprints/dist/pipelines/code-pipeline";
import * as team from "../Teams";
import {AwsLoadBalancerControllerProps} from "@aws-quickstart/eks-blueprints/dist/addons/aws-loadbalancer-controller";
import {ManagedNodeGroup} from "@aws-quickstart/eks-blueprints/dist/cluster-providers/types";
import {INSTANCE_TYPES} from "aws-cdk-lib/aws-eks/lib/instance-types";
import {InstanceType} from "aws-cdk-lib/aws-ec2";
import {KubernetesVersion} from "aws-cdk-lib/aws-eks";
import {GenericClusterProvider} from "@aws-quickstart/eks-blueprints/dist/cluster-providers/generic-cluster-provider";

export default class EksCapstoneClusterPipeline extends Construct {
    constructor(scope: Construct, id: string, props?: cdk.StackProps) {
        super(scope, id);

        // ArgoCD Workloads Repo URL:
        const argoCdRepo: ApplicationRepository = {
            repoUrl: 'https://github.com/mwilliams-trek10/eks-capstone-workloads.git',
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
            enableWaf: false,
            ingressClass: 'alb'
        };
        const awsLoadBalancerControllerAddOn: AwsLoadBalancerControllerAddOn = new AwsLoadBalancerControllerAddOn(awsLoadBalancerControllerProps);

        const kubeProxyAddOn: KubeProxyAddOn = new KubeProxyAddOn();

        const coreDnsAddOn: CoreDnsAddOn = new CoreDnsAddOn();

        const vpcCniAddOn: VpcCniAddOn = new VpcCniAddOn();

        const calicoAddOn: CalicoAddOn = new CalicoAddOn();

        const metricsServerAddOn: MetricsServerAddOn = new MetricsServerAddOn();

        // Karpenter:
        const karpenterAddOn: KarpenterAddOn = new blueprints.KarpenterAddOn({
            provisionerSpecs: {
                "node.kubernetes.io/instance-type": ['t3.micro'],
                "kubernetes.io/arch": ['x86-64'],
                "karpenter.sh/capacity-type": ['spot']
            }
        });

        // Create base blueprint.
        const blueprint = blueprints.EksBlueprint
            .builder()
            .account(account)
            .region(region)
            .addOns(
                awsLoadBalancerControllerAddOn,
                kubeProxyAddOn,
                coreDnsAddOn,
                vpcCniAddOn,
                karpenterAddOn,
                calicoAddOn,
                metricsServerAddOn)
            .teams();

        /******************************
         Stages
         ******************************/

        /***********
         * Development Stage
         ***********/
        const devArgoCd: ArgoCDAddOn = getArgoCdAddOnStage(argoCdRepo, 'env/Development');

        const devNodeGroup: ManagedNodeGroup = {
            id: 'backendManagedNodeGroup',
            desiredSize: 1,
            maxSize: 2,
            minSize: 1,
            instanceTypes: [new InstanceType('t4g.small')]
        }

        const devMngClusterProviderProps: MngClusterProviderProps = {
            desiredSize: 1,
            maxSize: 2,
            minSize: 1,
            instanceTypes: [new InstanceType('t4g.small')],
            version: KubernetesVersion.V1_21
        }
        // const devBackendClusterProvider: ClusterProvider = new blueprints.MngClusterProvider(devMngClusterProviderProps)

        const devGenericClusterProvider: GenericClusterProvider = new blueprints.ClusterBuilder()
            .withCommonOptions(devMngClusterProviderProps)
            .managedNodeGroup(devNodeGroup)
            .build()

        const devStageStackBuilder = blueprint
            .clone(region, account)
            .addOns(devArgoCd)
            .clusterProvider(devGenericClusterProvider);

        const devStage: StackStage = {
            id: 'development',
            stackBuilder: devStageStackBuilder
        };

        /***********
         * Staging Stage
         ***********/
        const stagingStageArgoCd: ArgoCDAddOn = getArgoCdAddOnStage(argoCdRepo, 'env/Staging');
        const stagingMngClusterProviderProps: MngClusterProviderProps = {
            desiredSize: 1,
            maxSize: 2,
            minSize: 1,
            instanceTypes: [new InstanceType('t4g.medium')],
            version: KubernetesVersion.V1_21
        }
        const stagingBackendClusterProvider: ClusterProvider = new blueprints.MngClusterProvider(stagingMngClusterProviderProps)
        const stagingStageStackBuilder = blueprint
            .clone(region, account)
            .addOns(stagingStageArgoCd)
            .clusterProvider(stagingBackendClusterProvider)
        const stagingStage: StackStage = {
            id: 'staging',
            stackBuilder: stagingStageStackBuilder
        };

        /***********
         * Production Stage
         ***********/
        const prodStageArgoCd: ArgoCDAddOn = getArgoCdAddOnStage(argoCdRepo, 'env/Production');
        const productionMngClusterProviderProps: MngClusterProviderProps = {
            desiredSize: 1,
            maxSize: 2,
            minSize: 1,
            instanceTypes: [new InstanceType('t4g.small')],
            version: KubernetesVersion.V1_21
        }
        const productionBackendClusterProvider: ClusterProvider = new blueprints.MngClusterProvider(productionMngClusterProviderProps)
        const productionStageStackBuilder = blueprint
            .clone(region, account)
            .addOns(prodStageArgoCd)
            .clusterProvider(productionBackendClusterProvider)
        const prodStage: StackStage = {
            id: 'production',
            stackBuilder: productionStageStackBuilder
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
            credentialsSecretName: "github-token",
            repoUrl: "eks-capstone-cluster-infra",
            targetRevision: "main"
        };

        blueprints.CodePipelineStack.builder()
            .name("eks-capstone-cluster-infra-pipeline")
            .owner("mwilliams-trek10")
            .repository(repo)
            .stage(devStage)
            // .stage(stagingStage)
            // .wave({
            //     id: "production-wave",
            //     stages: [prodStage /*, prodDrStage*/]
            // })
            .build(scope, id+'-stack', props)
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

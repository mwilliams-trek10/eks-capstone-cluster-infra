import {PlatformTeam} from "@aws-quickstart/eks-blueprints";
import {ArnPrincipal} from "aws-cdk-lib/aws-iam";

export default class EksPlatformTeam extends PlatformTeam {
    constructor(accountID: string) {
        super({
            name: "platform",
            userRoleArn: `arn:aws:iam::${accountID}:role/eks_platform_team`
        })
    }
}
